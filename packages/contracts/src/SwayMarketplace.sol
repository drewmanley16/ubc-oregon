// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ISwayMarketplace} from "./interfaces/ISwayMarketplace.sol";
import {IMerchantCredit} from "./interfaces/IMerchantCredit.sol";

/// @title SwayMarketplace
/// @notice Escrowed merchant-credit listings at Sway-set per-merchant rates + atomic discounted checkout.
/// @dev See ISwayMarketplace for pricing/rounding rules, checkout ordering and invariants.
contract SwayMarketplace is ISwayMarketplace, ERC1155Holder, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 internal constant BPS = 10_000;

    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable usdc;
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable credit;
    /// @dev USDC units per credit cent: 10**(decimals-2). 10_000 for 6-decimal USDC.
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    uint256 public immutable unitsPerCent;

    address public treasury;
    uint256 public nextListingId = 1;
    mapping(uint256 merchantId => Rates) public merchantRates;
    mapping(uint256 listingId => Listing) internal _listings;
    mapping(bytes32 orderId => bool) public orderSettled;

    constructor(address admin, address usdc_, address credit_, address treasury_) {
        if (admin == address(0) || usdc_ == address(0) || credit_ == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        uint8 dec = IERC20Metadata(usdc_).decimals();
        require(dec >= 2, "usdc decimals < 2");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        usdc = usdc_;
        credit = credit_;
        unitsPerCent = 10 ** (dec - 2);
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    // ───────────────────────── Pricing ────────────────────────

    /// @inheritdoc ISwayMarketplace
    function previewPrice(uint256 merchantId, uint256 creditCents)
        public
        view
        returns (uint256 askUsdcUnits, uint256 sellerPayoutUnits, uint256 feeUnits)
    {
        Rates memory r = merchantRates[merchantId];
        if (r.buyerPriceBps == 0) revert RatesNotSet(merchantId);
        uint256 faceUnits = creditCents * unitsPerCent;
        askUsdcUnits = Math.mulDiv(faceUnits, r.buyerPriceBps, BPS, Math.Rounding.Ceil);
        sellerPayoutUnits = Math.mulDiv(faceUnits, r.sellerPayoutBps, BPS, Math.Rounding.Floor);
        feeUnits = askUsdcUnits - sellerPayoutUnits;
    }

    // ───────────────────────── Seller ─────────────────────────

    /// @inheritdoc ISwayMarketplace
    function createListing(uint256 merchantId, uint256 creditCents)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 listingId)
    {
        if (creditCents == 0) revert ZeroAmount();
        (uint256 ask, uint256 payout,) = previewPrice(merchantId, creditCents);
        if (payout == 0) revert ZeroAmount();
        listingId = nextListingId++;
        _listings[listingId] = Listing({
            seller: msg.sender,
            merchantId: merchantId,
            creditCents: creditCents,
            askUsdcUnits: ask,
            sellerPayoutUnits: payout,
            status: ListingStatus.Active
        });
        emit ListingCreated(listingId, msg.sender, merchantId, creditCents, ask, payout);
        // Pull exactly the listed credit into escrow (reverts on insufficient balance / no approval).
        IERC1155(credit).safeTransferFrom(msg.sender, address(this), merchantId, creditCents, "");
    }

    /// @inheritdoc ISwayMarketplace
    /// @dev Intentionally NOT gated by whenNotPaused: sellers can always recover escrow.
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage l = _listings[listingId];
        if (l.status != ListingStatus.Active) revert ListingNotActive(listingId);
        if (l.seller != msg.sender) revert NotSeller(listingId, msg.sender);
        l.status = ListingStatus.Cancelled;
        emit ListingCancelled(listingId, msg.sender, l.creditCents);
        IERC1155(credit).safeTransferFrom(address(this), msg.sender, l.merchantId, l.creditCents, "");
    }

    // ───────────────────────── Buyer ──────────────────────────

    /// @inheritdoc ISwayMarketplace
    function checkout(
        uint256 listingId,
        bytes32 orderId,
        uint256 expectedMerchantId,
        uint256 maxUsdcUnits,
        uint256 expectedCreditCents
    ) external nonReentrant whenNotPaused {
        Listing storage l = _listings[listingId];

        // 1-3. Checks
        if (orderId == bytes32(0)) revert InvalidOrderId();
        if (l.status != ListingStatus.Active) revert ListingNotActive(listingId);
        if (l.merchantId != expectedMerchantId) revert WrongMerchant(expectedMerchantId, l.merchantId);
        if (orderSettled[orderId]) revert OrderAlreadySettled(orderId);
        if (l.askUsdcUnits > maxUsdcUnits) revert PriceAboveMax(l.askUsdcUnits, maxUsdcUnits);
        if (l.creditCents != expectedCreditCents) revert CreditAmountMismatch(expectedCreditCents, l.creditCents);

        // 4. Effects before any external call. Listing fields other than `status` are immutable after
        //    creation, so reading them from storage below is equivalent to caching (avoids stack-too-deep).
        orderSettled[orderId] = true;
        l.status = ListingStatus.Filled;

        // 5. Pay seller and Sway directly from buyer
        uint256 fee = l.askUsdcUnits - l.sellerPayoutUnits;
        IERC20(usdc).safeTransferFrom(msg.sender, l.seller, l.sellerPayoutUnits);
        if (fee > 0) IERC20(usdc).safeTransferFrom(msg.sender, treasury, fee);
        // 6. Burn the escrowed merchant credit
        IMerchantCredit(credit).redeem(expectedMerchantId, expectedCreditCents, orderId);
        // 7. Receipt
        emit CheckoutCompleted(
            orderId,
            expectedMerchantId,
            msg.sender,
            l.seller,
            expectedCreditCents,
            l.askUsdcUnits,
            l.sellerPayoutUnits,
            fee,
            listingId
        );
    }

    // ───────────────────────── Admin ──────────────────────────

    /// @inheritdoc ISwayMarketplace
    function setMerchantRates(uint256 merchantId, uint16 buyerPriceBps, uint16 sellerPayoutBps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (sellerPayoutBps == 0 || sellerPayoutBps > buyerPriceBps || buyerPriceBps > BPS) {
            revert InvalidRates(buyerPriceBps, sellerPayoutBps);
        }
        merchantRates[merchantId] = Rates(buyerPriceBps, sellerPayoutBps);
        emit MerchantRatesSet(merchantId, buyerPriceBps, sellerPayoutBps);
    }

    /// @inheritdoc ISwayMarketplace
    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ───────────────────────── Views ──────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Holder, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

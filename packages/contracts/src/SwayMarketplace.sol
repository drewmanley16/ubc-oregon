// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISwayMarketplace} from "./interfaces/ISwayMarketplace.sol";
import {IMerchantCredit} from "./interfaces/IMerchantCredit.sol";

/// @title SwayMarketplace
/// @notice Escrowed fixed-price merchant-credit listings + atomic discounted checkout.
/// @dev See ISwayMarketplace for the checkout ordering and invariants this implements.
contract SwayMarketplace is ISwayMarketplace, ERC1155Holder, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable usdc;
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable credit;

    uint256 public nextListingId = 1;
    mapping(uint256 listingId => Listing) internal _listings;
    mapping(bytes32 orderId => bool) public orderSettled;

    error ZeroAddress();

    constructor(address admin, address usdc_, address credit_) {
        if (admin == address(0) || usdc_ == address(0) || credit_ == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        usdc = usdc_;
        credit = credit_;
    }

    // ───────────────────────── Seller ─────────────────────────

    /// @inheritdoc ISwayMarketplace
    function createListing(uint256 merchantId, uint256 creditCents, uint256 askUsdcUnits)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 listingId)
    {
        if (creditCents == 0 || askUsdcUnits == 0) revert ZeroAmount();
        listingId = nextListingId++;
        _listings[listingId] = Listing({
            seller: msg.sender,
            merchantId: merchantId,
            creditCents: creditCents,
            askUsdcUnits: askUsdcUnits,
            status: ListingStatus.Active
        });
        emit ListingCreated(listingId, msg.sender, merchantId, creditCents, askUsdcUnits);
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

        // 4. Effects before any external call
        // (Listing fields other than `status` are immutable after creation, so reading them from
        //  storage below is equivalent to caching; avoids stack-too-deep.)
        orderSettled[orderId] = true;
        l.status = ListingStatus.Filled;

        // 5. Pay seller directly from buyer
        IERC20(usdc).safeTransferFrom(msg.sender, l.seller, l.askUsdcUnits);
        // 6. Burn the escrowed merchant credit
        IMerchantCredit(credit).redeem(expectedMerchantId, expectedCreditCents, orderId);
        // 7. Receipt
        emit CheckoutCompleted(
            orderId, expectedMerchantId, msg.sender, l.seller, expectedCreditCents, l.askUsdcUnits, listingId
        );
    }

    // ───────────────────────── Admin ──────────────────────────

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

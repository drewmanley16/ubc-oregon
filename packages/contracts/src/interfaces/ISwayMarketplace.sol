// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ISwayMarketplace — escrowed credit listings at Sway-set rates + atomic discounted checkout
/// @notice FROZEN CROSS-LANE INTERFACE. See IMerchantCredit for the change process.
///
/// Units:
///   - creditCents: merchant credit units ($0.01 each), same as IMerchantCredit.
///   - usdcUnits:   ERC-20 units of `usdc()`, using that token's `decimals()` (official Arc USDC = 6).
///                  NEVER the 18-decimal native-gas view of USDC on Arc.
///   - bps:         basis points of FACE value (10_000 = 100%).
///
/// Pricing (business model):
///   Sellers do NOT choose a price. Each merchant has admin-set rates:
///     buyerPriceBps   — what the buyer pays, as % of face   (demo: 8_800 = 88%)
///     sellerPayoutBps — what the seller receives, % of face (demo: 8_500 = 85%)
///   Sway's fee is the spread (demo: 3% of face), paid to `treasury()`.
///   Price + payout are computed and LOCKED at listing creation; later rate changes don't affect it.
///   Rounding: faceUnits = creditCents * 10**(decimals-2) (exact);
///             askUsdcUnits    = ceil (faceUnits * buyerPriceBps   / 10_000)
///             sellerPayoutUnits = floor(faceUnits * sellerPayoutBps / 10_000)
///             fee = askUsdcUnits - sellerPayoutUnits  (never negative; rounding never creates value)
///
/// Flow:
///   Seller:  credit.setApprovalForAll(marketplace, true) -> createListing(merchantId, creditCents)
///   Buyer:   usdc.approve(marketplace, askUsdcUnits)     -> checkout(...)
///
/// checkout MUST, atomically (any failure reverts everything):
///   1. require listing Active and listing.merchantId == expectedMerchantId          (I6)
///   2. require !orderSettled(orderId)                                                (I3)
///   3. require listing.askUsdcUnits <= maxUsdcUnits                                  (I5)
///      require listing.creditCents == expectedCreditCents (exact cover, MVP)
///   4. mark orderSettled[orderId] = true and listing.status = Filled BEFORE external calls
///   5. safeTransferFrom(buyer, seller, sellerPayoutUnits); safeTransferFrom(buyer, treasury, fee) if fee > 0
///   6. credit.redeem(merchantId, creditCents, orderId)  // burns marketplace escrow
///   7. emit CheckoutCompleted(...)
/// Use ReentrancyGuard, Pausable (admin), SafeERC20, custom errors. No upgradability.
///
/// Invariants (spec §5): I2 listing never sells more than escrowed; I4 seller paid + fee + credit burned
/// atomically; I7 only seller cancels, refund is exact; I8 integer math only;
/// I9 buyer paid == seller payout + fee, exactly.
interface ISwayMarketplace {
    enum ListingStatus {
        None, // 0 — listing id does not exist
        Active, // 1
        Filled, // 2
        Cancelled // 3
    }

    struct Listing {
        address seller;
        uint256 merchantId;
        uint256 creditCents;
        uint256 askUsdcUnits; // buyer pays
        uint256 sellerPayoutUnits; // seller receives; fee = ask - payout
        ListingStatus status;
    }

    struct Rates {
        uint16 buyerPriceBps;
        uint16 sellerPayoutBps;
    }

    // ───────────────────────── Events ─────────────────────────
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed merchantId,
        uint256 creditCents,
        uint256 askUsdcUnits,
        uint256 sellerPayoutUnits
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller, uint256 creditCents);
    /// @notice The demo merchant's payment/redemption receipt. Backend receipts are built from this event.
    /// @param usdcUnits total the buyer paid (== sellerPayoutUnits + feeUnits)
    event CheckoutCompleted(
        bytes32 indexed orderId,
        uint256 indexed merchantId,
        address indexed buyer,
        address seller,
        uint256 creditCents,
        uint256 usdcUnits,
        uint256 sellerPayoutUnits,
        uint256 feeUnits,
        uint256 listingId
    );
    event MerchantRatesSet(uint256 indexed merchantId, uint16 buyerPriceBps, uint16 sellerPayoutBps);
    event TreasurySet(address indexed treasury);

    // ───────────────────────── Errors ─────────────────────────
    error ListingNotActive(uint256 listingId);
    error NotSeller(uint256 listingId, address caller);
    error WrongMerchant(uint256 expected, uint256 actual);
    error OrderAlreadySettled(bytes32 orderId);
    error PriceAboveMax(uint256 askUsdcUnits, uint256 maxUsdcUnits);
    error CreditAmountMismatch(uint256 expected, uint256 actual);
    error ZeroAmount();
    error InvalidOrderId();
    error ZeroAddress();
    error RatesNotSet(uint256 merchantId);
    /// @dev requires 0 < sellerPayoutBps <= buyerPriceBps <= 10_000
    error InvalidRates(uint16 buyerPriceBps, uint16 sellerPayoutBps);

    // ───────────────────────── Seller ─────────────────────────
    /// @notice Pulls exactly `creditCents` of merchant credit into escrow at the merchant's current rates.
    ///         Ids start at 1. Reverts RatesNotSet if the merchant has no rates.
    function createListing(uint256 merchantId, uint256 creditCents) external returns (uint256 listingId);

    /// @notice Seller-only. Returns exactly the escrowed credit. Reverts if not Active. Works while paused.
    function cancelListing(uint256 listingId) external;

    // ───────────────────────── Buyer ──────────────────────────
    /// @param orderId random non-zero bytes32 from POST /api/orders. Settled at most once, globally.
    function checkout(
        uint256 listingId,
        bytes32 orderId,
        uint256 expectedMerchantId,
        uint256 maxUsdcUnits,
        uint256 expectedCreditCents
    ) external;

    // ───────────────────────── Admin ──────────────────────────
    function setMerchantRates(uint256 merchantId, uint16 buyerPriceBps, uint16 sellerPayoutBps) external;
    function setTreasury(address treasury) external;
    function pause() external;
    function unpause() external;

    // ───────────────────────── Views ──────────────────────────
    function usdc() external view returns (address);
    function credit() external view returns (address);
    function treasury() external view returns (address);
    function merchantRates(uint256 merchantId) external view returns (uint16 buyerPriceBps, uint16 sellerPayoutBps);
    /// @notice What a listing of `creditCents` would cost/pay at current rates. Reverts RatesNotSet.
    function previewPrice(uint256 merchantId, uint256 creditCents)
        external
        view
        returns (uint256 askUsdcUnits, uint256 sellerPayoutUnits, uint256 feeUnits);
    function getListing(uint256 listingId) external view returns (Listing memory);
    /// @notice Next id to be assigned. Existing ids are [1, nextListingId).
    function nextListingId() external view returns (uint256);
    function orderSettled(bytes32 orderId) external view returns (bool);
}

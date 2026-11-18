// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ISwayMarketplace — escrowed fixed-price credit listings + atomic discounted checkout
/// @notice FROZEN CROSS-LANE INTERFACE. See IMerchantCredit for the change process.
///
/// Units:
///   - creditCents: merchant credit units ($0.01 each), same as IMerchantCredit.
///   - usdcUnits:   ERC-20 units of `usdc()`, using that token's `decimals()` (official Arc USDC = 6).
///                  NEVER the 18-decimal native-gas view of USDC on Arc.
///
/// Flow:
///   Seller:  credit.setApprovalForAll(marketplace, true) -> createListing(...)
///   Buyer:   usdc.approve(marketplace, askUsdcUnits)     -> checkout(...)
///
/// checkout MUST, atomically (any failure reverts everything):
///   1. require listing Active and listing.merchantId == expectedMerchantId          (I6)
///   2. require !orderSettled(orderId)                                                (I3)
///   3. require listing.askUsdcUnits <= maxUsdcUnits                                  (I5)
///      require listing.creditCents == expectedCreditCents (exact cover, MVP)
///   4. mark orderSettled[orderId] = true and listing.status = Filled BEFORE external calls
///   5. SafeERC20.safeTransferFrom(buyer, listing.seller, listing.askUsdcUnits)
///   6. credit.redeem(merchantId, creditCents, orderId)  // burns marketplace escrow
///   7. emit CheckoutCompleted(...)
/// Use ReentrancyGuard, Pausable (admin), SafeERC20, custom errors. No upgradability.
///
/// Invariants (spec §5): I2 listing never sells more than escrowed; I4 seller paid + credit burned
/// atomically; I7 only seller cancels, refund is exact; I8 integer math only.
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
        uint256 askUsdcUnits;
        ListingStatus status;
    }

    // ───────────────────────── Events ─────────────────────────
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed merchantId,
        uint256 creditCents,
        uint256 askUsdcUnits
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller, uint256 creditCents);
    /// @notice The demo merchant's payment/redemption receipt. Backend receipts are built from this event.
    event CheckoutCompleted(
        bytes32 indexed orderId,
        uint256 indexed merchantId,
        address indexed buyer,
        address seller,
        uint256 creditCents,
        uint256 usdcUnits,
        uint256 listingId
    );

    // ───────────────────────── Errors ─────────────────────────
    error ListingNotActive(uint256 listingId);
    error NotSeller(uint256 listingId, address caller);
    error WrongMerchant(uint256 expected, uint256 actual);
    error OrderAlreadySettled(bytes32 orderId);
    error PriceAboveMax(uint256 askUsdcUnits, uint256 maxUsdcUnits);
    error CreditAmountMismatch(uint256 expected, uint256 actual);
    error ZeroAmount();
    error InvalidOrderId();

    // ───────────────────────── Seller ─────────────────────────
    /// @notice Pulls exactly `creditCents` of merchant credit into escrow. Ids start at 1.
    function createListing(uint256 merchantId, uint256 creditCents, uint256 askUsdcUnits)
        external
        returns (uint256 listingId);

    /// @notice Seller-only. Returns exactly the escrowed credit. Reverts if not Active.
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
    function pause() external;
    function unpause() external;

    // ───────────────────────── Views ──────────────────────────
    function usdc() external view returns (address);
    function credit() external view returns (address);
    function getListing(uint256 listingId) external view returns (Listing memory);
    /// @notice Next id to be assigned. Existing ids are [1, nextListingId).
    function nextListingId() external view returns (uint256);
    function orderSettled(bytes32 orderId) external view returns (bool);
}

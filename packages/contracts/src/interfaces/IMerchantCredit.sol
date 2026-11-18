// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IMerchantCredit — merchant-issued prepaid credit (ERC-1155)
/// @notice FROZEN CROSS-LANE INTERFACE. Changing a signature, event or error here
///         breaks the backend indexer and the web app. Change only via a PR that
///         also regenerates `packages/shared/src/abi` (`pnpm abi`) and notes it in docs/STATUS.md.
///
/// Units & ids:
///   - tokenId == merchantId (one fungible token id per fictional merchant).
///   - 1 unit == $0.01 of merchant credit. 10_000 units == $100.00. Integer math only.
///
/// Invariants (spec §5):
///   I1  Outstanding credit for a merchant increases ONLY via `mintCredit` by that merchant's issuer.
///   I6  Credit for merchant A is a different tokenId than merchant B; never fungible across merchants.
///   -   `redeem` burns ONLY the caller's own balance and only callers holding REDEEMER_ROLE
///       (the SwayMarketplace). Nobody can force-burn another account's credit.
///   -   No permissionless mint. No upgradability.
///
/// Implementation guidance: OpenZeppelin ERC1155 + AccessControl. Admin (DEFAULT_ADMIN_ROLE)
/// registers merchants and grants REDEEMER_ROLE to the marketplace in the deploy script.
interface IMerchantCredit {
    // ───────────────────────── Events ─────────────────────────
    event MerchantRegistered(uint256 indexed merchantId, address indexed issuer);
    /// @param memo free-form reference (e.g. keccak of an off-chain issuance record). Not PII.
    event CreditIssued(
        uint256 indexed merchantId, address indexed issuer, address indexed to, uint256 cents, bytes32 memo
    );
    event CreditRedeemed(uint256 indexed merchantId, address indexed redeemer, bytes32 indexed orderId, uint256 cents);

    // ───────────────────────── Errors ─────────────────────────
    error UnknownMerchant(uint256 merchantId);
    error MerchantAlreadyRegistered(uint256 merchantId);
    error NotIssuer(uint256 merchantId, address caller);
    error ZeroAmount();
    error ZeroAddress();

    // ───────────────────────── Admin ──────────────────────────
    /// @notice Admin-only. Registers a merchant id and its sole authorized issuer.
    function registerMerchant(uint256 merchantId, address issuer) external;

    // ───────────────────────── Issuer ─────────────────────────
    /// @notice Only `issuerOf(merchantId)` may call. Mints `cents` credit to `to`.
    /// @dev Reverts UnknownMerchant / NotIssuer / ZeroAmount / ZeroAddress. Emits CreditIssued.
    function mintCredit(uint256 merchantId, address to, uint256 cents, bytes32 memo) external;

    // ───────────────────────── Redeemer ───────────────────────
    /// @notice REDEEMER_ROLE only. Burns `cents` of `merchantId` credit from msg.sender's OWN balance.
    /// @dev Emits CreditRedeemed. Called by SwayMarketplace.checkout on its escrow.
    function redeem(uint256 merchantId, uint256 cents, bytes32 orderId) external;

    // ───────────────────────── Views ──────────────────────────
    function REDEEMER_ROLE() external view returns (bytes32);
    function issuerOf(uint256 merchantId) external view returns (address);
    function totalIssued(uint256 merchantId) external view returns (uint256 cents);
    function totalRedeemed(uint256 merchantId) external view returns (uint256 cents);
    /// @notice totalIssued - totalRedeemed.
    function outstanding(uint256 merchantId) external view returns (uint256 cents);
}

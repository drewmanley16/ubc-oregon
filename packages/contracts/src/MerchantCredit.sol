// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IMerchantCredit} from "./interfaces/IMerchantCredit.sol";

/// @title MerchantCredit
/// @notice Merchant-issued prepaid credit. tokenId == merchantId, 1 unit == $0.01.
/// @dev DEMO CREDIT ONLY: fictional merchants, no real-world backing.
///      Supply changes ONLY via issuer `mintCredit` (+) and redeemer `redeem` (-). There is no other
///      mint/burn path, so `totalIssued - totalRedeemed == totalSupply(merchantId)` at all times.
contract MerchantCredit is ERC1155, AccessControl, IMerchantCredit {
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");

    mapping(uint256 merchantId => address) public issuerOf;
    mapping(uint256 merchantId => uint256) public totalIssued;
    mapping(uint256 merchantId => uint256) public totalRedeemed;

    constructor(address admin, string memory uri_) ERC1155(uri_) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @inheritdoc IMerchantCredit
    function registerMerchant(uint256 merchantId, address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (issuer == address(0)) revert ZeroAddress();
        if (issuerOf[merchantId] != address(0)) revert MerchantAlreadyRegistered(merchantId);
        issuerOf[merchantId] = issuer;
        emit MerchantRegistered(merchantId, issuer);
    }

    /// @inheritdoc IMerchantCredit
    function mintCredit(uint256 merchantId, address to, uint256 cents, bytes32 memo) external {
        address issuer = issuerOf[merchantId];
        if (issuer == address(0)) revert UnknownMerchant(merchantId);
        if (msg.sender != issuer) revert NotIssuer(merchantId, msg.sender);
        if (to == address(0)) revert ZeroAddress();
        if (cents == 0) revert ZeroAmount();
        totalIssued[merchantId] += cents;
        emit CreditIssued(merchantId, issuer, to, cents, memo);
        _mint(to, merchantId, cents, "");
    }

    /// @inheritdoc IMerchantCredit
    function redeem(uint256 merchantId, uint256 cents, bytes32 orderId) external onlyRole(REDEEMER_ROLE) {
        if (cents == 0) revert ZeroAmount();
        totalRedeemed[merchantId] += cents;
        _burn(msg.sender, merchantId, cents); // reverts if caller's own balance is insufficient
        emit CreditRedeemed(merchantId, msg.sender, orderId, cents);
    }

    /// @inheritdoc IMerchantCredit
    function outstanding(uint256 merchantId) external view returns (uint256) {
        return totalIssued[merchantId] - totalRedeemed[merchantId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

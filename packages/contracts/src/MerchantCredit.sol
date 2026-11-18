// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IMerchantCredit} from "./interfaces/IMerchantCredit.sol";

/// @title MerchantCredit
/// @notice LANE D (tech lead) — SKELETON. Implement against IMerchantCredit; read its NatSpec first.
/// @dev DEMO CREDIT ONLY: fictional merchants, no real-world backing.
contract MerchantCredit is ERC1155, AccessControl, IMerchantCredit {
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");

    error NotImplemented();

    mapping(uint256 => address) public issuerOf;
    mapping(uint256 => uint256) public totalIssued;
    mapping(uint256 => uint256) public totalRedeemed;

    constructor(address admin, string memory uri_) ERC1155(uri_) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerMerchant(uint256, address) external pure {
        revert NotImplemented(); // TODO(lane-D): admin-only; set issuerOf; emit MerchantRegistered
    }

    function mintCredit(uint256, address, uint256, bytes32) external pure {
        revert NotImplemented(); // TODO(lane-D): issuer-only; _mint; totalIssued += ; emit CreditIssued
    }

    function redeem(uint256, uint256, bytes32) external pure {
        revert NotImplemented(); // TODO(lane-D): REDEEMER_ROLE; _burn(msg.sender,...); totalRedeemed += ; emit CreditRedeemed
    }

    function outstanding(uint256 merchantId) external view returns (uint256) {
        return totalIssued[merchantId] - totalRedeemed[merchantId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

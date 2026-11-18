// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISwayMarketplace} from "./interfaces/ISwayMarketplace.sol";
import {IMerchantCredit} from "./interfaces/IMerchantCredit.sol";

/// @title SwayMarketplace
/// @notice LANE D (tech lead) — SKELETON. Implement against ISwayMarketplace; its NatSpec lists the
///         exact checkout ordering (checks -> effects -> interactions) that tests will enforce.
contract SwayMarketplace is ISwayMarketplace, ERC1155Holder, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotImplemented();

    address public immutable usdc;
    address public immutable credit;
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) internal _listings;
    mapping(bytes32 => bool) public orderSettled;

    constructor(address admin, address usdc_, address credit_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        usdc = usdc_;
        credit = credit_;
    }

    function createListing(uint256, uint256, uint256) external pure returns (uint256) {
        revert NotImplemented(); // TODO(lane-D)
    }

    function cancelListing(uint256) external pure {
        revert NotImplemented(); // TODO(lane-D)
    }

    function checkout(uint256, bytes32, uint256, uint256, uint256) external pure {
        revert NotImplemented(); // TODO(lane-D): follow ISwayMarketplace steps 1-7 exactly
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Holder, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ISwayMarketplace} from "../../src/interfaces/ISwayMarketplace.sol";

/// transferFrom returns false instead of reverting (SafeERC20 must catch it).
contract FalseReturnToken is ERC20 {
    constructor() ERC20("False", "FALSE") {}

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        return false;
    }
}

/// On transferFrom, tries to re-enter marketplace.checkout with a different order id.
contract ReentrantToken is ERC20 {
    ISwayMarketplace public market;
    uint256 public listingId;
    uint256 public merchantId;
    uint256 public cents;
    bool public attempted;
    bool public reentrySucceeded;

    constructor() ERC20("Reenter", "RE") {}

    function arm(ISwayMarketplace m, uint256 l, uint256 mid, uint256 c) external {
        market = m;
        listingId = l;
        merchantId = mid;
        cents = c;
    }

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }

    function transferFrom(address from, address to, uint256 amt) public override returns (bool) {
        if (address(market) != address(0) && !attempted) {
            attempted = true;
            try market.checkout(listingId, keccak256("reenter"), merchantId, type(uint256).max, cents) {
                reentrySucceeded = true;
            } catch {}
        }
        return super.transferFrom(from, to, amt);
    }
}

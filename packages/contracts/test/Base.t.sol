// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Shared fixture mirroring the demo: Daybreak Coffee (merchantId 1) issues $100 to seller,
/// seller lists for $88. Tests use MockUSDC locally; Arc deploy uses official USDC via env.
abstract contract Base is Test {
    uint256 internal constant DAYBREAK = 1;
    uint256 internal constant NORTHLINE = 2;
    uint256 internal constant FACE_CENTS = 10_000; // $100.00
    uint256 internal constant ASK_UNITS = 88_000_000; // 88 USDC @ 6 decimals

    address internal admin = makeAddr("admin");
    address internal issuer = makeAddr("daybreakIssuer");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");

    MerchantCredit internal credit;
    SwayMarketplace internal market;
    MockUSDC internal usdc;

    function setUp() public virtual {
        usdc = new MockUSDC();
        credit = new MerchantCredit(admin, "");
        market = new SwayMarketplace(admin, address(usdc), address(credit));
        bytes32 redeemerRole = credit.REDEEMER_ROLE();
        vm.prank(admin);
        credit.grantRole(redeemerRole, address(market));
        // TODO(lane-D): once registerMerchant/mintCredit exist, register DAYBREAK -> issuer,
        // mint FACE_CENTS to seller, fund buyer with usdc.faucet(buyer, 100e6).
    }
}

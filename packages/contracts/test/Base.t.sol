// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Demo fixture: Daybreak Coffee (1) issues $100 to seller; listed at 88% (buyer) / 85% (seller) / 3% fee.
abstract contract Base is Test {
    uint256 internal constant DAYBREAK = 1;
    uint256 internal constant NORTHLINE = 2;
    uint256 internal constant FACE_CENTS = 10_000; // $100.00
    uint256 internal constant ASK_UNITS = 88_000_000; // buyer pays 88 USDC @ 6dp (88% of face)
    uint256 internal constant PAYOUT_UNITS = 85_000_000; // seller receives 85 USDC (85% of face)
    uint256 internal constant FEE_UNITS = 3_000_000; // Sway keeps 3 USDC
    uint16 internal constant BUYER_BPS = 8_800;
    uint16 internal constant SELLER_BPS = 8_500;
    bytes32 internal constant ORDER_1 = keccak256("order-1");

    address internal admin = makeAddr("admin");
    address internal issuer = makeAddr("daybreakIssuer");
    address internal northlineIssuer = makeAddr("northlineIssuer");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");
    address internal treasury = makeAddr("treasury");

    MerchantCredit internal credit;
    SwayMarketplace internal market;
    MockUSDC internal usdc;

    function setUp() public virtual {
        usdc = new MockUSDC();
        credit = new MerchantCredit(admin, "");
        market = new SwayMarketplace(admin, address(usdc), address(credit), treasury);
        bytes32 redeemerRole = credit.REDEEMER_ROLE();
        vm.startPrank(admin);
        credit.grantRole(redeemerRole, address(market));
        credit.registerMerchant(DAYBREAK, issuer);
        credit.registerMerchant(NORTHLINE, northlineIssuer);
        market.setMerchantRates(DAYBREAK, BUYER_BPS, SELLER_BPS);
        market.setMerchantRates(NORTHLINE, BUYER_BPS, SELLER_BPS);
        vm.stopPrank();

        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, FACE_CENTS, bytes32("seed"));
        vm.prank(seller);
        credit.setApprovalForAll(address(market), true);

        usdc.faucet(buyer, 100e6);
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
    }

    function _list() internal returns (uint256 id) {
        vm.prank(seller);
        id = market.createListing(DAYBREAK, FACE_CENTS);
    }

    function _checkout(uint256 id, bytes32 orderId) internal {
        vm.prank(buyer);
        market.checkout(id, orderId, DAYBREAK, ASK_UNITS, FACE_CENTS);
    }
}

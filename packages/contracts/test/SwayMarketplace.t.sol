// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";
import {ISwayMarketplace} from "../src/interfaces/ISwayMarketplace.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {FalseReturnToken, ReentrantToken} from "./mocks/BadTokens.sol";

contract SwayMarketplaceTest is Base {
    // ───────────── listing / escrow ─────────────
    function test_createListingEscrowsExactCredit() public {
        vm.expectEmit(address(market));
        emit ISwayMarketplace.ListingCreated(1, seller, DAYBREAK, FACE_CENTS, ASK_UNITS);
        uint256 id = _list();
        assertEq(id, 1);
        assertEq(market.nextListingId(), 2);
        assertEq(credit.balanceOf(seller, DAYBREAK), 0);
        assertEq(credit.balanceOf(address(market), DAYBREAK), FACE_CENTS);
        ISwayMarketplace.Listing memory l = market.getListing(id);
        assertEq(l.seller, seller);
        assertEq(l.merchantId, DAYBREAK);
        assertEq(l.creditCents, FACE_CENTS);
        assertEq(l.askUsdcUnits, ASK_UNITS);
        assertEq(uint8(l.status), uint8(ISwayMarketplace.ListingStatus.Active));
    }

    function test_revert_createListingInsufficientCredit() public {
        vm.prank(seller);
        vm.expectRevert(); // ERC1155InsufficientBalance
        market.createListing(DAYBREAK, FACE_CENTS + 1, ASK_UNITS);
        assertEq(market.nextListingId(), 1);
    }

    function test_revert_createListingWithoutApproval() public {
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, stranger, 100, 0);
        vm.prank(stranger);
        vm.expectRevert(); // ERC1155MissingApprovalForAll
        market.createListing(DAYBREAK, 100, 1);
    }

    function test_revert_createListingZeroAmounts() public {
        vm.startPrank(seller);
        vm.expectRevert(ISwayMarketplace.ZeroAmount.selector);
        market.createListing(DAYBREAK, 0, ASK_UNITS);
        vm.expectRevert(ISwayMarketplace.ZeroAmount.selector);
        market.createListing(DAYBREAK, FACE_CENTS, 0);
        vm.stopPrank();
    }

    function test_cancelReturnsExactCredit() public {
        uint256 id = _list();
        vm.expectEmit(address(market));
        emit ISwayMarketplace.ListingCancelled(id, seller, FACE_CENTS);
        vm.prank(seller);
        market.cancelListing(id);
        assertEq(credit.balanceOf(seller, DAYBREAK), FACE_CENTS);
        assertEq(credit.balanceOf(address(market), DAYBREAK), 0);
        assertEq(uint8(market.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Cancelled));
    }

    function test_revert_onlySellerCanCancel() public {
        uint256 id = _list();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.NotSeller.selector, id, stranger));
        market.cancelListing(id);
    }

    function test_revert_cancelAfterFill() public {
        uint256 id = _list();
        _checkout(id, ORDER_1);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.ListingNotActive.selector, id));
        market.cancelListing(id);
    }

    function test_revert_cancelTwice() public {
        uint256 id = _list();
        vm.startPrank(seller);
        market.cancelListing(id);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.ListingNotActive.selector, id));
        market.cancelListing(id);
        vm.stopPrank();
    }

    // ───────────── checkout happy path ─────────────
    function test_checkoutPaysSellerExactAsk() public {
        uint256 id = _list();
        _checkout(id, ORDER_1);
        assertEq(usdc.balanceOf(seller), ASK_UNITS);
        assertEq(usdc.balanceOf(buyer), 100e6 - ASK_UNITS);
        assertEq(usdc.balanceOf(address(market)), 0);
    }

    function test_checkoutBurnsExactFaceCredit() public {
        uint256 id = _list();
        _checkout(id, ORDER_1);
        assertEq(credit.balanceOf(address(market), DAYBREAK), 0);
        assertEq(credit.balanceOf(buyer, DAYBREAK), 0);
        assertEq(credit.totalRedeemed(DAYBREAK), FACE_CENTS);
    }

    function test_checkoutEmitsCheckoutCompleted() public {
        uint256 id = _list();
        vm.expectEmit(address(market));
        emit ISwayMarketplace.CheckoutCompleted(ORDER_1, DAYBREAK, buyer, seller, FACE_CENTS, ASK_UNITS, id);
        _checkout(id, ORDER_1);
    }

    function test_checkoutMarksListingFilledAndOrderSettled() public {
        uint256 id = _list();
        assertFalse(market.orderSettled(ORDER_1));
        _checkout(id, ORDER_1);
        assertTrue(market.orderSettled(ORDER_1));
        assertEq(uint8(market.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Filled));
    }

    function test_checkoutBuyerMaxAboveAskStillChargesAsk() public {
        uint256 id = _list();
        vm.prank(buyer);
        market.checkout(id, ORDER_1, DAYBREAK, 95e6, FACE_CENTS);
        assertEq(usdc.balanceOf(seller), ASK_UNITS);
    }

    // ───────────── checkout guards ─────────────
    function test_revert_duplicateOrderId() public {
        _checkout(_list(), ORDER_1);
        // fresh listing, same order id
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, FACE_CENTS, 0);
        uint256 id2 = _list();
        usdc.faucet(buyer, 100e6);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.OrderAlreadySettled.selector, ORDER_1));
        market.checkout(id2, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_priceAboveBuyerMax() public {
        uint256 id = _list();
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.PriceAboveMax.selector, ASK_UNITS, ASK_UNITS - 1));
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS - 1, FACE_CENTS);
    }

    function test_revert_wrongMerchant() public {
        uint256 id = _list();
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.WrongMerchant.selector, NORTHLINE, DAYBREAK));
        market.checkout(id, ORDER_1, NORTHLINE, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_creditAmountMismatch() public {
        uint256 id = _list();
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.CreditAmountMismatch.selector, 9_999, FACE_CENTS));
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, 9_999);
    }

    function test_revert_filledListingCannotBeReused() public {
        uint256 id = _list();
        _checkout(id, ORDER_1);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.ListingNotActive.selector, id));
        market.checkout(id, keccak256("order-2"), DAYBREAK, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_cancelledListing() public {
        uint256 id = _list();
        vm.prank(seller);
        market.cancelListing(id);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.ListingNotActive.selector, id));
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_nonexistentListing() public {
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.ListingNotActive.selector, 42));
        market.checkout(42, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_zeroOrderId() public {
        uint256 id = _list();
        vm.prank(buyer);
        vm.expectRevert(ISwayMarketplace.InvalidOrderId.selector);
        market.checkout(id, bytes32(0), DAYBREAK, ASK_UNITS, FACE_CENTS);
    }

    function test_revert_whenPaused_butCancelStillWorks() public {
        uint256 id = _list();
        vm.prank(admin);
        market.pause();
        vm.prank(buyer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        vm.prank(seller);
        market.cancelListing(id); // escrow is always recoverable
        assertEq(credit.balanceOf(seller, DAYBREAK), FACE_CENTS);
    }

    function test_revert_insufficientAllowanceRollsBackEverything() public {
        uint256 id = _list();
        vm.prank(buyer);
        usdc.approve(address(market), ASK_UNITS - 1);
        vm.prank(buyer);
        vm.expectRevert(); // ERC20InsufficientAllowance
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        _assertUntouched(id);
    }

    function test_revert_insufficientBalanceRollsBackEverything() public {
        uint256 id = _list();
        vm.prank(buyer);
        assertTrue(usdc.transfer(stranger, 50e6)); // leaves 50 USDC < 88 ask
        vm.prank(buyer);
        vm.expectRevert(); // ERC20InsufficientBalance
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        _assertUntouched(id);
    }

    function test_revert_falseReturningTokenRollsBackEverything() public {
        FalseReturnToken bad = new FalseReturnToken();
        SwayMarketplace m2 = new SwayMarketplace(admin, address(bad), address(credit));
        bytes32 role = credit.REDEEMER_ROLE();
        vm.prank(admin);
        credit.grantRole(role, address(m2));
        vm.prank(seller);
        credit.setApprovalForAll(address(m2), true);
        vm.prank(seller);
        uint256 id = m2.createListing(DAYBREAK, FACE_CENTS, ASK_UNITS);
        vm.prank(buyer);
        vm.expectRevert(); // SafeERC20FailedOperation
        m2.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        assertFalse(m2.orderSettled(ORDER_1));
        assertEq(uint8(m2.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Active));
        assertEq(credit.balanceOf(address(m2), DAYBREAK), FACE_CENTS);
    }

    function test_revert_reentrancyBlocked() public {
        ReentrantToken evil = new ReentrantToken();
        SwayMarketplace m2 = new SwayMarketplace(admin, address(evil), address(credit));
        bytes32 role = credit.REDEEMER_ROLE();
        vm.prank(admin);
        credit.grantRole(role, address(m2));
        // two listings so a successful re-entry would have something to buy
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, FACE_CENTS, 0);
        vm.startPrank(seller);
        credit.setApprovalForAll(address(m2), true);
        uint256 id1 = m2.createListing(DAYBREAK, FACE_CENTS, ASK_UNITS);
        uint256 id2 = m2.createListing(DAYBREAK, FACE_CENTS, ASK_UNITS);
        vm.stopPrank();
        evil.arm(m2, id2, DAYBREAK, FACE_CENTS);
        evil.mint(buyer, 1_000e6);
        vm.startPrank(buyer);
        evil.approve(address(m2), type(uint256).max);
        m2.checkout(id1, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        vm.stopPrank();
        assertTrue(evil.attempted());
        assertFalse(evil.reentrySucceeded());
        assertEq(uint8(m2.getListing(id2).status), uint8(ISwayMarketplace.ListingStatus.Active));
        assertEq(evil.balanceOf(seller), ASK_UNITS);
    }

    function testFuzz_sellerReceivesExactAsk(uint64 ask, uint32 cents) public {
        vm.assume(ask > 0 && cents > 0);
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, cents, 0);
        vm.prank(seller);
        uint256 id = market.createListing(DAYBREAK, cents, ask);
        deal(address(usdc), buyer, ask);
        vm.prank(buyer);
        market.checkout(id, ORDER_1, DAYBREAK, ask, cents);
        assertEq(usdc.balanceOf(seller), ask);
        assertEq(usdc.balanceOf(buyer), 0);
        assertEq(credit.balanceOf(address(market), DAYBREAK), 0);
    }

    function _assertUntouched(uint256 id) internal view {
        assertFalse(market.orderSettled(ORDER_1));
        assertEq(uint8(market.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Active));
        assertEq(credit.balanceOf(address(market), DAYBREAK), FACE_CENTS);
        assertEq(credit.totalRedeemed(DAYBREAK), 0);
        assertEq(usdc.balanceOf(seller), 0);
    }
}

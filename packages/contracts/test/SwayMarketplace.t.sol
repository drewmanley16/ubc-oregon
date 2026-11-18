// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";
import {ISwayMarketplace} from "../src/interfaces/ISwayMarketplace.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {FalseReturnToken, ReentrantToken, TwoDecimalToken} from "./mocks/BadTokens.sol";

contract SwayMarketplaceTest is Base {
    // ───────────── pricing ─────────────
    function test_previewPriceDemoRates() public view {
        (uint256 ask, uint256 payout, uint256 fee) = market.previewPrice(DAYBREAK, FACE_CENTS);
        assertEq(ask, ASK_UNITS);
        assertEq(payout, PAYOUT_UNITS);
        assertEq(fee, FEE_UNITS);
    }

    /// With 6-dp USDC every split is exact (1 cent = 10_000 units). Rounding only matters for
    /// low-decimal tokens; prove direction with a 2-dp token where 1 cent == 1 unit.
    function test_previewPriceRoundsBuyerUpSellerDown() public {
        SwayMarketplace m2 = _altMarket(address(new TwoDecimalToken()));
        vm.prank(admin);
        m2.setMerchantRates(DAYBREAK, 8_850, 8_550);
        // face = 1 unit: ask = ceil(0.885) = 1, payout = floor(0.855) = 0
        (uint256 ask, uint256 payout, uint256 fee) = m2.previewPrice(DAYBREAK, 1);
        assertEq(ask, 1);
        assertEq(payout, 0);
        assertEq(fee, 1);
        // face = 10 units: ask = ceil(8.85) = 9, payout = floor(8.55) = 8, fee = 1
        (ask, payout, fee) = m2.previewPrice(DAYBREAK, 10);
        assertEq(ask, 9);
        assertEq(payout, 8);
        assertEq(fee, 1);
    }

    function test_revert_listingWithZeroPayoutAfterRounding() public {
        SwayMarketplace m2 = _altMarket(address(new TwoDecimalToken()));
        vm.prank(admin);
        m2.setMerchantRates(DAYBREAK, 8_850, 8_550);
        vm.startPrank(seller);
        credit.setApprovalForAll(address(m2), true);
        vm.expectRevert(ISwayMarketplace.ZeroAmount.selector);
        m2.createListing(DAYBREAK, 1); // seller would receive 0
        vm.stopPrank();
    }

    function testFuzz_priceSplitIsExactAndNeverCreatesValue(uint16 buyerBps, uint16 sellerBps, uint32 cents) public {
        buyerBps = uint16(bound(buyerBps, 1, 10_000));
        sellerBps = uint16(bound(sellerBps, 1, buyerBps));
        vm.assume(cents > 0);
        vm.prank(admin);
        market.setMerchantRates(7, buyerBps, sellerBps);
        (uint256 ask, uint256 payout, uint256 fee) = market.previewPrice(7, cents);
        uint256 face = uint256(cents) * 10_000;
        assertEq(ask, payout + fee);
        assertLe(ask, face); // buyer never pays more than face
        assertGe(ask * 10_000, face * buyerBps); // ceil
        assertLe(payout * 10_000, face * sellerBps); // floor
    }

    function test_revert_listingWithoutRates() public {
        vm.prank(admin);
        credit.registerMerchant(3, issuer);
        vm.prank(issuer);
        credit.mintCredit(3, seller, 100, 0);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.RatesNotSet.selector, 3));
        market.createListing(3, 100);
    }

    function test_revert_invalidRates() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.InvalidRates.selector, 8_000, 8_500));
        market.setMerchantRates(DAYBREAK, 8_000, 8_500); // seller > buyer
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.InvalidRates.selector, 10_001, 8_500));
        market.setMerchantRates(DAYBREAK, 10_001, 8_500); // above face
        vm.expectRevert(abi.encodeWithSelector(ISwayMarketplace.InvalidRates.selector, 8_800, 0));
        market.setMerchantRates(DAYBREAK, 8_800, 0);
        vm.stopPrank();
    }

    function test_revert_onlyAdminSetsRatesAndTreasury() public {
        bytes32 role = market.DEFAULT_ADMIN_ROLE();
        vm.startPrank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, role)
        );
        market.setMerchantRates(DAYBREAK, 10_000, 10_000);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, role)
        );
        market.setTreasury(stranger);
        vm.stopPrank();
    }

    function test_rateChangeDoesNotAffectExistingListing() public {
        uint256 id = _list();
        vm.prank(admin);
        market.setMerchantRates(DAYBREAK, 9_900, 5_000);
        _checkout(id, ORDER_1); // still 88 / 85 / 3
        assertEq(usdc.balanceOf(seller), PAYOUT_UNITS);
        assertEq(usdc.balanceOf(treasury), FEE_UNITS);
    }

    function test_setTreasuryRedirectsFees() public {
        address t2 = makeAddr("treasury2");
        vm.prank(admin);
        market.setTreasury(t2);
        _checkout(_list(), ORDER_1);
        assertEq(usdc.balanceOf(t2), FEE_UNITS);
        assertEq(usdc.balanceOf(treasury), 0);
    }

    function test_zeroFeeRatesSkipTreasuryTransfer() public {
        vm.prank(admin);
        market.setMerchantRates(DAYBREAK, 9_000, 9_000);
        uint256 id = _list();
        vm.prank(buyer);
        market.checkout(id, ORDER_1, DAYBREAK, 90e6, FACE_CENTS);
        assertEq(usdc.balanceOf(seller), 90e6);
        assertEq(usdc.balanceOf(treasury), 0);
    }

    // ───────────── listing / escrow ─────────────
    function test_createListingEscrowsExactCreditAtLockedPrice() public {
        vm.expectEmit(address(market));
        emit ISwayMarketplace.ListingCreated(1, seller, DAYBREAK, FACE_CENTS, ASK_UNITS, PAYOUT_UNITS);
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
        assertEq(l.sellerPayoutUnits, PAYOUT_UNITS);
        assertEq(uint8(l.status), uint8(ISwayMarketplace.ListingStatus.Active));
    }

    function test_revert_createListingInsufficientCredit() public {
        vm.prank(seller);
        vm.expectRevert(); // ERC1155InsufficientBalance
        market.createListing(DAYBREAK, FACE_CENTS + 1);
        assertEq(market.nextListingId(), 1);
    }

    function test_revert_createListingWithoutApproval() public {
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, stranger, 100, 0);
        vm.prank(stranger);
        vm.expectRevert(); // ERC1155MissingApprovalForAll
        market.createListing(DAYBREAK, 100);
    }

    function test_revert_createListingZeroAmount() public {
        vm.prank(seller);
        vm.expectRevert(ISwayMarketplace.ZeroAmount.selector);
        market.createListing(DAYBREAK, 0);
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
    function test_checkoutSplitsPaymentExactly() public {
        _checkout(_list(), ORDER_1);
        assertEq(usdc.balanceOf(seller), PAYOUT_UNITS);
        assertEq(usdc.balanceOf(treasury), FEE_UNITS);
        assertEq(usdc.balanceOf(buyer), 100e6 - ASK_UNITS);
        assertEq(usdc.balanceOf(address(market)), 0);
    }

    function test_checkoutBurnsExactFaceCredit() public {
        _checkout(_list(), ORDER_1);
        assertEq(credit.balanceOf(address(market), DAYBREAK), 0);
        assertEq(credit.balanceOf(buyer, DAYBREAK), 0);
        assertEq(credit.totalRedeemed(DAYBREAK), FACE_CENTS);
    }

    function test_checkoutEmitsCheckoutCompleted() public {
        uint256 id = _list();
        vm.expectEmit(address(market));
        emit ISwayMarketplace.CheckoutCompleted(
            ORDER_1, DAYBREAK, buyer, seller, FACE_CENTS, ASK_UNITS, PAYOUT_UNITS, FEE_UNITS, id
        );
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
        assertEq(usdc.balanceOf(buyer), 100e6 - ASK_UNITS);
    }

    // ───────────── checkout guards ─────────────
    function test_revert_duplicateOrderId() public {
        _checkout(_list(), ORDER_1);
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
        market.cancelListing(id);
        assertEq(credit.balanceOf(seller, DAYBREAK), FACE_CENTS);
    }

    function test_revert_allowanceCoversPayoutButNotFeeRollsBackEverything() public {
        uint256 id = _list();
        vm.prank(buyer);
        usdc.approve(address(market), PAYOUT_UNITS); // seller leg succeeds, fee leg fails
        vm.prank(buyer);
        vm.expectRevert(); // ERC20InsufficientAllowance
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        _assertUntouched(id);
    }

    function test_revert_insufficientBalanceRollsBackEverything() public {
        uint256 id = _list();
        vm.prank(buyer);
        assertTrue(usdc.transfer(stranger, 14e6)); // leaves 86: covers payout (85) but not ask (88)
        vm.prank(buyer);
        vm.expectRevert(); // ERC20InsufficientBalance
        market.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        _assertUntouched(id);
    }

    function test_revert_falseReturningTokenRollsBackEverything() public {
        FalseReturnToken bad = new FalseReturnToken();
        SwayMarketplace m2 = _altMarket(address(bad));
        vm.prank(seller);
        credit.setApprovalForAll(address(m2), true);
        vm.prank(seller);
        uint256 id = m2.createListing(DAYBREAK, FACE_CENTS);
        vm.prank(buyer);
        vm.expectRevert(); // SafeERC20FailedOperation
        m2.checkout(id, ORDER_1, DAYBREAK, ASK_UNITS, FACE_CENTS);
        assertFalse(m2.orderSettled(ORDER_1));
        assertEq(uint8(m2.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Active));
        assertEq(credit.balanceOf(address(m2), DAYBREAK), FACE_CENTS);
    }

    function test_revert_reentrancyBlocked() public {
        ReentrantToken evil = new ReentrantToken();
        SwayMarketplace m2 = _altMarket(address(evil));
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, FACE_CENTS, 0);
        vm.startPrank(seller);
        credit.setApprovalForAll(address(m2), true);
        uint256 id1 = m2.createListing(DAYBREAK, FACE_CENTS);
        uint256 id2 = m2.createListing(DAYBREAK, FACE_CENTS);
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
        assertEq(evil.balanceOf(seller), PAYOUT_UNITS);
        assertEq(evil.balanceOf(treasury), FEE_UNITS);
    }

    function testFuzz_buyerPaysExactlyPayoutPlusFee(uint32 cents, uint16 buyerBps, uint16 sellerBps) public {
        vm.assume(cents > 0);
        buyerBps = uint16(bound(buyerBps, 1, 10_000));
        sellerBps = uint16(bound(sellerBps, 1, buyerBps));
        vm.prank(admin);
        market.setMerchantRates(DAYBREAK, buyerBps, sellerBps);
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, seller, cents, 0);
        vm.prank(seller);
        uint256 id = market.createListing(DAYBREAK, cents);
        ISwayMarketplace.Listing memory l = market.getListing(id);
        deal(address(usdc), buyer, l.askUsdcUnits);
        vm.prank(buyer);
        market.checkout(id, ORDER_1, DAYBREAK, l.askUsdcUnits, cents);
        assertEq(usdc.balanceOf(buyer), 0);
        assertEq(usdc.balanceOf(seller), l.sellerPayoutUnits);
        assertEq(usdc.balanceOf(treasury), l.askUsdcUnits - l.sellerPayoutUnits);
        assertEq(credit.balanceOf(address(market), DAYBREAK), 0);
    }

    function _altMarket(address token) internal returns (SwayMarketplace m2) {
        m2 = new SwayMarketplace(admin, token, address(credit), treasury);
        bytes32 role = credit.REDEEMER_ROLE();
        vm.startPrank(admin);
        credit.grantRole(role, address(m2));
        m2.setMerchantRates(DAYBREAK, BUYER_BPS, SELLER_BPS);
        vm.stopPrank();
    }

    function _assertUntouched(uint256 id) internal view {
        assertFalse(market.orderSettled(ORDER_1));
        assertEq(uint8(market.getListing(id).status), uint8(ISwayMarketplace.ListingStatus.Active));
        assertEq(credit.balanceOf(address(market), DAYBREAK), FACE_CENTS);
        assertEq(credit.totalRedeemed(DAYBREAK), 0);
        assertEq(usdc.balanceOf(seller), 0);
        assertEq(usdc.balanceOf(treasury), 0);
    }
}

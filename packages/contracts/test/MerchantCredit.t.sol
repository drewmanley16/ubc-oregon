// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";
import {IMerchantCredit} from "../src/interfaces/IMerchantCredit.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract MerchantCreditTest is Base {
    function test_issuerCanMint() public {
        vm.expectEmit(address(credit));
        emit IMerchantCredit.CreditIssued(DAYBREAK, issuer, stranger, 2_500, bytes32("m"));
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, stranger, 2_500, bytes32("m"));
        assertEq(credit.balanceOf(stranger, DAYBREAK), 2_500);
        assertEq(credit.totalIssued(DAYBREAK), FACE_CENTS + 2_500);
    }

    function test_revert_nonIssuerCannotMint() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IMerchantCredit.NotIssuer.selector, DAYBREAK, stranger));
        credit.mintCredit(DAYBREAK, stranger, 1, 0);
    }

    function test_revert_otherMerchantsIssuerCannotMint() public {
        vm.prank(northlineIssuer);
        vm.expectRevert(abi.encodeWithSelector(IMerchantCredit.NotIssuer.selector, DAYBREAK, northlineIssuer));
        credit.mintCredit(DAYBREAK, northlineIssuer, 1, 0);
    }

    function test_revert_adminIsNotImplicitlyIssuer() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(IMerchantCredit.NotIssuer.selector, DAYBREAK, admin));
        credit.mintCredit(DAYBREAK, admin, 1, 0);
    }

    function test_revert_mintUnknownMerchant() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(IMerchantCredit.UnknownMerchant.selector, 99));
        credit.mintCredit(99, seller, 1, 0);
    }

    function test_revert_mintZeroAmountOrZeroAddress() public {
        vm.startPrank(issuer);
        vm.expectRevert(IMerchantCredit.ZeroAmount.selector);
        credit.mintCredit(DAYBREAK, seller, 0, 0);
        vm.expectRevert(IMerchantCredit.ZeroAddress.selector);
        credit.mintCredit(DAYBREAK, address(0), 1, 0);
        vm.stopPrank();
    }

    function test_revert_registerMerchantTwice() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(IMerchantCredit.MerchantAlreadyRegistered.selector, DAYBREAK));
        credit.registerMerchant(DAYBREAK, stranger);
    }

    function test_revert_nonAdminCannotRegister() public {
        bytes32 role = credit.DEFAULT_ADMIN_ROLE();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, role)
        );
        credit.registerMerchant(3, stranger);
    }

    function test_revert_nonRedeemerCannotRedeem() public {
        bytes32 role = credit.REDEEMER_ROLE();
        vm.prank(seller); // holds credit, but is not a redeemer
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, seller, role));
        credit.redeem(DAYBREAK, FACE_CENTS, ORDER_1);
    }

    function test_redeemBurnsOnlyCallerBalance() public {
        // A redeemer with no balance cannot burn someone else's credit.
        bytes32 role = credit.REDEEMER_ROLE();
        vm.prank(admin);
        credit.grantRole(role, stranger);
        vm.prank(stranger);
        vm.expectRevert(); // ERC1155InsufficientBalance
        credit.redeem(DAYBREAK, 1, ORDER_1);
        assertEq(credit.balanceOf(seller, DAYBREAK), FACE_CENTS);
    }

    function test_outstandingTracksIssuedMinusRedeemed() public {
        assertEq(credit.outstanding(DAYBREAK), FACE_CENTS);
        _checkout(_list(), ORDER_1);
        assertEq(credit.totalRedeemed(DAYBREAK), FACE_CENTS);
        assertEq(credit.outstanding(DAYBREAK), 0);
    }

    function testFuzz_mintExactCents(uint96 cents) public {
        vm.assume(cents > 0);
        vm.prank(issuer);
        credit.mintCredit(DAYBREAK, stranger, cents, 0);
        assertEq(credit.balanceOf(stranger, DAYBREAK), cents);
        assertEq(credit.outstanding(DAYBREAK), FACE_CENTS + uint256(cents));
    }
}

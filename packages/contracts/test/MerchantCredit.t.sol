// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";

/// LANE D — every test below is REQUIRED by spec §10. Remove vm.skip and implement.
contract MerchantCreditTest is Base {
    function test_issuerCanMint() public {
        vm.skip(true);
    }

    function test_revert_nonIssuerCannotMint() public {
        vm.skip(true);
    }

    function test_revert_adminIsNotImplicitlyIssuer() public {
        vm.skip(true);
    }

    function test_revert_mintUnknownMerchant() public {
        vm.skip(true);
    }

    function test_revert_registerMerchantTwice() public {
        vm.skip(true);
    }

    function test_revert_nonRedeemerCannotRedeem() public {
        vm.skip(true);
    }

    function test_redeemBurnsOnlyCallerBalance() public {
        vm.skip(true);
    }

    function test_outstandingTracksIssuedMinusRedeemed() public {
        vm.skip(true);
    }

    function testFuzz_mintExactCents(uint96 cents) public {
        cents;
        vm.skip(true);
    }
}

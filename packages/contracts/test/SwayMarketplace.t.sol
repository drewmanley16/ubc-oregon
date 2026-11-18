// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";

/// LANE D — every test below is REQUIRED by spec §10. Remove vm.skip and implement.
contract SwayMarketplaceTest is Base {
    // listing / escrow
    function test_createListingEscrowsExactCredit() public {
        vm.skip(true);
    }

    function test_revert_createListingInsufficientCredit() public {
        vm.skip(true);
    }

    function test_revert_createListingZeroAmounts() public {
        vm.skip(true);
    }

    function test_cancelReturnsExactCredit() public {
        vm.skip(true);
    }

    function test_revert_onlySellerCanCancel() public {
        vm.skip(true);
    }

    function test_revert_cancelAfterFill() public {
        vm.skip(true);
    }

    // checkout happy path
    function test_checkoutPaysSellerExactAsk() public {
        vm.skip(true);
    }

    function test_checkoutBurnsExactFaceCredit() public {
        vm.skip(true);
    }

    function test_checkoutEmitsCheckoutCompleted() public {
        vm.skip(true);
    }

    function test_checkoutMarksListingFilledAndOrderSettled() public {
        vm.skip(true);
    }

    // checkout guards
    function test_revert_duplicateOrderId() public {
        vm.skip(true);
    }

    function test_revert_priceAboveBuyerMax() public {
        vm.skip(true);
    }

    function test_revert_wrongMerchant() public {
        vm.skip(true);
    }

    function test_revert_creditAmountMismatch() public {
        vm.skip(true);
    }

    function test_revert_filledListingCannotBeReused() public {
        vm.skip(true);
    }

    function test_revert_cancelledListing() public {
        vm.skip(true);
    }

    function test_revert_zeroOrderId() public {
        vm.skip(true);
    }

    function test_revert_whenPaused() public {
        vm.skip(true);
    }

    function test_revert_insufficientAllowanceRollsBackEverything() public {
        vm.skip(true);
    }

    function test_revert_reentrancyBlocked() public {
        vm.skip(true); // use a malicious ERC20 mock
    }
}

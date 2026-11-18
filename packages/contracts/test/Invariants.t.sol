// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base} from "./Base.t.sol";

/// LANE D — stateful invariants (spec §5). Build a Handler that randomly lists/cancels/checks out.
contract InvariantsTest is Base {
    function test_invariant_escrowEqualsSumOfActiveListings() public {
        vm.skip(true);
    }

    function test_invariant_outstandingOnlyIncreasesViaMint() public {
        vm.skip(true);
    }

    function test_invariant_sellerProceedsEqualSumOfFilledAsks() public {
        vm.skip(true);
    }
}

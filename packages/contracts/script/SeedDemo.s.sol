// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";

/// LANE D — SKELETON. Deterministic, re-runnable demo fixture:
///   Daybreak issuer mints 10_000 cents ($100) to SELLER -> seller approves -> createListing(1, 10_000, 88e6).
/// Env: MERCHANT_1_ISSUER_PRIVATE_KEY, SELLER_PRIVATE_KEY. NEVER use anvil's default mnemonic on Arc:
/// 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 is blocklisted on Arc testnet.
contract SeedDemo is Script {
    function run() external pure {
        console2.log("TODO(lane-D): implement SeedDemo");
    }
}

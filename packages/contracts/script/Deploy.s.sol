// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";

/// LANE D — SKELETON.
/// Usage: forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
/// Env: DEPLOYER_PRIVATE_KEY, USDC_ADDRESS (empty => deploy MockUSDC and flag it), MERCHANT_*_ISSUER
/// Must: deploy MerchantCredit + SwayMarketplace, grant REDEEMER_ROLE, register merchants 1..3,
///       assert IERC20Metadata(usdc).decimals() == 6, write deployments/arc-testnet.json
///       { chainId, merchantCredit, marketplace, usdc, usdcIsMock, usdcDecimals, deployBlock }.
contract Deploy is Script {
    function run() external pure {
        console2.log("TODO(lane-D): implement Deploy");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";

/// Deterministic, re-runnable demo fixture. Each run issues fresh $100 credit to the seller and lists it:
///   Daybreak Coffee (1)  $100 -> 88 USDC   (the hero demo: save $12)
///   Northline Apparel(2) $100 -> 90 USDC
///   Parkside Market (3)  $100 -> 85 USDC
///   forge script script/SeedDemo.s.sol --rpc-url arc_testnet --broadcast
/// Env: MERCHANT_1_ISSUER_PRIVATE_KEY (issuer of all 3 by default), SELLER_PRIVATE_KEY,
///      SEED_ONLY_DAYBREAK=true to seed just the hero listing.
/// NEVER use anvil default keys on Arc (0x7099…79C8 is blocklisted).
contract SeedDemo is Script {
    uint256 internal constant FACE = 10_000;

    function run() external {
        string memory path = block.chainid == 5042002
            ? "deployments/arc-testnet.json"
            : string.concat("deployments/local-", vm.toString(block.chainid), ".json");
        string memory json = vm.readFile(path);
        MerchantCredit credit = MerchantCredit(vm.parseJsonAddress(json, ".merchantCredit"));
        SwayMarketplace market = SwayMarketplace(vm.parseJsonAddress(json, ".marketplace"));

        uint256 issuerPk = vm.envUint("MERCHANT_1_ISSUER_PRIVATE_KEY");
        uint256 sellerPk = vm.envUint("SELLER_PRIVATE_KEY");
        address seller = vm.addr(sellerPk);
        bool onlyDaybreak = vm.envOr("SEED_ONLY_DAYBREAK", false);

        uint256[3] memory asks = [uint256(88e6), 90e6, 85e6];
        uint256 n = onlyDaybreak ? 1 : 3;

        vm.startBroadcast(issuerPk);
        for (uint256 m = 1; m <= n; ++m) {
            credit.mintCredit(m, seller, FACE, keccak256(abi.encode("sway-demo-seed", m, block.number)));
        }
        vm.stopBroadcast();

        vm.startBroadcast(sellerPk);
        if (!credit.isApprovedForAll(seller, address(market))) credit.setApprovalForAll(address(market), true);
        for (uint256 m = 1; m <= n; ++m) {
            uint256 id = market.createListing(m, FACE, asks[m - 1]);
            console2.log("listing", id, "merchant", m);
        }
        vm.stopBroadcast();
    }
}

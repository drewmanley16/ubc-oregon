// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";

/// Deterministic, re-runnable demo fixture. Each run issues fresh $100 credit to the seller and lists
/// it at each merchant's Sway-set rates (demo: buyer pays 88, seller gets 85, Sway keeps 3).
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

        uint256 n = onlyDaybreak ? 1 : 3;

        vm.startBroadcast(issuerPk);
        for (uint256 m = 1; m <= n; ++m) {
            credit.mintCredit(m, seller, FACE, keccak256(abi.encode("sway-demo-seed", m, block.number)));
        }
        vm.stopBroadcast();

        vm.startBroadcast(sellerPk);
        if (!credit.isApprovedForAll(seller, address(market))) credit.setApprovalForAll(address(market), true);
        for (uint256 m = 1; m <= n; ++m) {
            uint256 id = market.createListing(m, FACE);
            SwayMarketplace.Listing memory l = market.getListing(id);
            console2.log("listing", id, "merchant", m);
            console2.log("  buyer pays / seller gets (units)", l.askUsdcUnits, l.sellerPayoutUnits);
        }
        vm.stopBroadcast();
    }
}

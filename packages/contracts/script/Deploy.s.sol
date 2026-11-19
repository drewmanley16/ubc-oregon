// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Deploys MerchantCredit + SwayMarketplace, wires roles, registers demo merchants 1..3.
///   forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
/// Env:
///   DEPLOYER_PRIVATE_KEY        admin + deployer
///   USDC_ADDRESS                official USDC; set to empty string to deploy MockUSDC instead
///   MERCHANT_1_ISSUER_ADDRESS   issuer for Daybreak Coffee (1)
///   MERCHANT_2_ISSUER_ADDRESS / MERCHANT_3_ISSUER_ADDRESS   optional; default to merchant 1's issuer
///   TREASURY_ADDRESS            receives Sway's fee; defaults to the deployer
///   BUYER_PRICE_BPS / SELLER_PAYOUT_BPS   rates for merchants 1..3; default 8800 / 8500 (fee 3% of face)
/// Writes deployments/arc-testnet.json on chain 5042002, else deployments/local-<chainid>.json.
contract Deploy is Script {
    uint256 internal constant ARC_TESTNET = 5042002;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.addr(pk);
        address issuer1 = vm.envAddress("MERCHANT_1_ISSUER_ADDRESS");
        address issuer2 = vm.envOr("MERCHANT_2_ISSUER_ADDRESS", issuer1);
        address issuer3 = vm.envOr("MERCHANT_3_ISSUER_ADDRESS", issuer1);
        address usdc = vm.envOr("USDC_ADDRESS", address(0));
        address treasury = vm.envOr("TREASURY_ADDRESS", admin);
        uint16 buyerBps = uint16(vm.envOr("BUYER_PRICE_BPS", uint256(8_800)));
        uint16 sellerBps = uint16(vm.envOr("SELLER_PAYOUT_BPS", uint256(8_500)));
        uint256 deployBlock = block.number;

        vm.startBroadcast(pk);
        bool isMock = usdc == address(0);
        if (isMock) usdc = address(new MockUSDC());
        uint8 decimals = IERC20Metadata(usdc).decimals();
        require(decimals == 6, "USDC must have 6 decimals");

        MerchantCredit credit = new MerchantCredit(admin, "");
        SwayMarketplace market = new SwayMarketplace(admin, usdc, address(credit), treasury);
        credit.grantRole(credit.REDEEMER_ROLE(), address(market));
        credit.registerMerchant(1, issuer1);
        credit.registerMerchant(2, issuer2);
        credit.registerMerchant(3, issuer3);
        for (uint256 m = 1; m <= 3; ++m) {
            market.setMerchantRates(m, buyerBps, sellerBps);
        }
        vm.stopBroadcast();

        string memory k = "deployment";
        vm.serializeUint(k, "chainId", block.chainid);
        vm.serializeAddress(k, "merchantCredit", address(credit));
        vm.serializeAddress(k, "marketplace", address(market));
        vm.serializeAddress(k, "usdc", usdc);
        vm.serializeBool(k, "usdcIsMock", isMock);
        vm.serializeAddress(k, "treasury", treasury);
        vm.serializeUint(k, "usdcDecimals", decimals);
        string memory json = vm.serializeUint(k, "deployBlock", deployBlock);
        string memory path = block.chainid == ARC_TESTNET
            ? "deployments/arc-testnet.json"
            : string.concat("deployments/local-", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);

        console2.log("MerchantCredit ", address(credit));
        console2.log("SwayMarketplace", address(market));
        console2.log("USDC           ", usdc, isMock ? "(MOCK)" : "(official)");
        console2.log("Treasury       ", treasury);
        console2.log("Rates (bps)    ", buyerBps, sellerBps);
        console2.log("wrote          ", path);
    }
}

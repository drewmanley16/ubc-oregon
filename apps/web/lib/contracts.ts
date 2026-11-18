// LANE D owns. Single import point for on-chain addresses + ABIs on the client.
import { getDeployment, merchantCreditAbi, swayMarketplaceAbi, arcTestnet } from "@sway/shared";
import { erc20Abi } from "viem";

export const chain = arcTestnet;
export const deployment = getDeployment(); // null until lane D deploys
export const abis = { merchantCredit: merchantCreditAbi, marketplace: swayMarketplaceAbi, erc20: erc20Abi };

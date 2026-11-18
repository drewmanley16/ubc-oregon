import type { Address } from "./types.ts";
import arcTestnet from "../../contracts/deployments/arc-testnet.json" with { type: "json" };

/** Written by packages/contracts/script/Deploy.s.sol. Empty until lane D deploys. */
export type Deployment = {
  chainId: number;
  merchantCredit: Address;
  marketplace: Address;
  usdc: Address;
  usdcIsMock: boolean;
  usdcDecimals: number;
  deployBlock: number;
};

export function getDeployment(): Deployment | null {
  const d = arcTestnet as Partial<Deployment>;
  return d.marketplace ? (d as Deployment) : null;
}

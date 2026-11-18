// LANE C. Server-side chain reads. Chain state ALWAYS wins over any cache.
import "server-only";
import { createPublicClient, http } from "viem";
import { arcTestnet, getDeployment } from "@sway/shared";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0]),
});

export function requireDeployment() {
  const d = getDeployment();
  if (!d) throw new Error("Contracts not deployed yet — packages/contracts/deployments/arc-testnet.json is empty");
  return d;
}

// TODO(lane-C):
//  - readActiveListings(merchantId): iterate [1, nextListingId) via multicall getListing, filter Active.
//    (Fine at demo scale; optionally speed up with ListingCreated logs from deployBlock.)
//  - findCheckoutReceipt(orderId): getLogs CheckoutCompleted filtered by indexed orderId; require
//    the tx receipt status === "success" before returning a CheckoutReceipt.

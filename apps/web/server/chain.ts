// LANE C. Server-side chain reads. Chain state ALWAYS wins over any cache.
import "server-only";
import { createPublicClient, decodeEventLog, http, type Log } from "viem";
import {
  arcTestnet,
  explorerTxUrl,
  getDeployment,
  swayMarketplaceAbi,
  type CheckoutReceipt,
  type Hex,
  type ListingStatus,
  type MarketplaceListing,
} from "@sway/shared";
import { conservativeSavingsCents } from "./quote.ts";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  // JSON-RPC batching (works on Arc and on a local anvil; no multicall3 dependency).
  transport: http(process.env.ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0], { batch: true }),
});

export function requireDeployment() {
  const d = getDeployment();
  if (!d) throw new Error("Contracts not deployed yet — packages/contracts/deployments/arc-testnet.json is empty");
  return d;
}

const STATUS: Record<number, ListingStatus | undefined> = { 1: "ACTIVE", 2: "FILLED", 3: "CANCELLED" };

/** Arc RPC rejects eth_getLogs ranges much above 2,000 blocks (~18 min at ~0.56 s/block). */
const LOG_CHUNK = 2_000n;
/** Bounded lookback for log scans (~3 h). Older history is reached via known tx hashes, not scans. */
const LOOKBACK_BLOCKS = 20_000n;

async function recentLogs<T>(fetchChunk: (from: bigint, to: bigint) => Promise<T[]>): Promise<T[]> {
  const d = requireDeployment();
  const head = await publicClient.getBlockNumber({ cacheTime: 0 }); // viem caches ~4s by default; Arc makes ~7 blocks in that time
  const floor = BigInt(d.deployBlock);
  const start = head - LOOKBACK_BLOCKS > floor ? head - LOOKBACK_BLOCKS : floor;
  const ranges: [bigint, bigint][] = [];
  for (let from = start; from <= head; from += LOG_CHUNK) {
    const to = from + LOG_CHUNK - 1n < head ? from + LOG_CHUNK - 1n : head;
    ranges.push([from, to]);
  }
  return (await Promise.all(ranges.map(([f, t]) => fetchChunk(f, t)))).flat();
}

/** All listings (any status), read straight from contract storage. Fine at demo scale. */
export async function readListings(merchantId?: number): Promise<MarketplaceListing[]> {
  const d = requireDeployment();
  const next = await publicClient.readContract({ address: d.marketplace, abi: swayMarketplaceAbi, functionName: "nextListingId" });
  const ids = Array.from({ length: Number(next - 1n) }, (_, i) => BigInt(i + 1));
  const raw = await Promise.all(
    ids.map((id) => publicClient.readContract({ address: d.marketplace, abi: swayMarketplaceAbi, functionName: "getListing", args: [id] })),
  );

  // Creation tx hashes are best-effort (recent window only); null if older than the lookback.
  let created = new Map<bigint, Hex>();
  try {
    const logs = await recentLogs((fromBlock, toBlock) =>
      publicClient.getContractEvents({ address: d.marketplace, abi: swayMarketplaceAbi, eventName: "ListingCreated", fromBlock, toBlock }),
    );
    created = new Map(logs.map((l) => [l.args.listingId!, l.transactionHash]));
  } catch {
    /* tx hashes are cosmetic; listing data above is authoritative */
  }

  return raw.flatMap((l, i) => {
    const status = STATUS[Number(l.status)];
    if (!status) return [];
    if (merchantId !== undefined && l.merchantId !== BigInt(merchantId)) return [];
    return [
      {
        listingId: ids[i].toString(),
        merchantId: Number(l.merchantId),
        sellerAddress: l.seller,
        faceValueCents: l.creditCents.toString(),
        askUsdcUnits: l.askUsdcUnits.toString(),
        sellerPayoutUnits: l.sellerPayoutUnits.toString(),
        status,
        txHash: created.get(ids[i]) ?? null,
      },
    ];
  });
}

export async function isOrderSettled(orderId: Hex) {
  const d = requireDeployment();
  return publicClient.readContract({ address: d.marketplace, abi: swayMarketplaceAbi, functionName: "orderSettled", args: [orderId] });
}

function receiptFromLog(log: Log, blockNumber: bigint, usdcDecimals: number): CheckoutReceipt {
  const ev = decodeEventLog({ abi: swayMarketplaceAbi, eventName: "CheckoutCompleted", data: log.data, topics: log.topics });
  const a = ev.args;
  return {
    orderId: a.orderId,
    merchantId: Number(a.merchantId),
    buyer: a.buyer,
    seller: a.seller,
    listingId: a.listingId.toString(),
    creditCents: a.creditCents.toString(),
    usdcUnits: a.usdcUnits.toString(),
    sellerPayoutUnits: a.sellerPayoutUnits.toString(),
    feeUnits: a.feeUnits.toString(),
    grossSavingsCents: conservativeSavingsCents(a.creditCents, a.usdcUnits, usdcDecimals).toString(),
    txHash: log.transactionHash!,
    blockNumber: blockNumber.toString(),
    explorerUrl: explorerTxUrl(log.transactionHash!),
  };
}

/** Finds CheckoutCompleted(orderId) inside a tx that the CHAIN says succeeded. */
async function receiptFromTx(orderId: Hex, txHash: Hex): Promise<CheckoutReceipt | null> {
  const d = requireDeployment();
  const r = await publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!r || r.status !== "success") return null;
  for (const log of r.logs) {
    if (log.address.toLowerCase() !== d.marketplace.toLowerCase()) continue;
    try {
      const rec = receiptFromLog(log, r.blockNumber, d.usdcDecimals);
      if (rec.orderId.toLowerCase() === orderId.toLowerCase()) return rec;
    } catch {
      /* not a CheckoutCompleted log */
    }
  }
  return null;
}

/**
 * Chain-confirmed receipt for an order, or null. Never trusts the caller:
 * a supplied txHash is only a lookup hint and is fully re-verified (success status, our
 * marketplace address, matching indexed orderId). Without a hint, scans recent blocks.
 */
export async function findCheckoutReceipt(orderId: Hex, txHint?: Hex): Promise<CheckoutReceipt | null> {
  if (txHint) {
    const viaHint = await receiptFromTx(orderId, txHint);
    if (viaHint) return viaHint;
  }
  const d = requireDeployment();
  const logs = await recentLogs((fromBlock, toBlock) =>
    publicClient.getContractEvents({
      address: d.marketplace,
      abi: swayMarketplaceAbi,
      eventName: "CheckoutCompleted",
      args: { orderId },
      fromBlock,
      toBlock,
    }),
  );
  for (const log of logs) {
    const rec = await receiptFromTx(orderId, log.transactionHash);
    if (rec) return rec;
  }
  return null;
}

// LANE C. Seller flow: verify card -> swap into Sway vault -> mint on-chain credit 1:1 -> make buyable.
// Ordering guarantees value is never minted without a vaulted card behind it.
import "server-only";
import { randomUUID } from "node:crypto";
import type { Address, Hex } from "@sway/shared";
import { kv } from "./kv.ts";
import { addToPool, swapIntoVault } from "./giftcards.ts";
import { isStatelessDemo, swapDemoCard } from "./stateless-cards.ts";
import { ensureSellerGas, mintCreditTo } from "./issuer.ts";

export type SaleStatus = "SWAPPED" | "MINTING" | "READY_TO_LIST";
export type Sale = {
  saleId: string;
  seller: Address;
  merchantId: number;
  faceCents: string;
  oldLast4: string;
  status: SaleStatus;
  mintTx?: Hex;
  gasTx?: Hex | null;
  createdAt: string;
};
type StoredSale = Sale & { vaultNumber: string };

const key = (id: string) => `gc:sale:${id}`;
const pub = (s: StoredSale): Sale => {
  const { vaultNumber, ...rest } = s;
  void vaultNumber; // never leaves the server
  return rest;
};

async function finish(s: StoredSale): Promise<Sale> {
  if (s.status === "SWAPPED") {
    await kv().set(key(s.saleId), { ...s, status: "MINTING" });
    const mintTx = await mintCreditTo(s.merchantId, s.seller, BigInt(s.faceCents), s.saleId);
    await addToPool(s.vaultNumber);
    s = { ...s, status: "READY_TO_LIST", mintTx };
    await kv().set(key(s.saleId), s);
  }
  if (s.status === "READY_TO_LIST" && s.gasTx === undefined) {
    // Best effort: a failed top-up must not undo a completed swap + mint.
    const gasTx = await ensureSellerGas(s.merchantId, s.seller).catch((e) => {
      console.error("gas top-up failed", (e as Error).message);
      return null;
    });
    s = { ...s, gasTx };
    await kv().set(key(s.saleId), s);
  }
  return pub(s);
}

export async function submitCard(input: { merchantId: number; number: string; pin: string; seller: Address }) {
  if (isStatelessDemo(input.number)) {
    // Storage-free: swap recorded on Arc, then credit minted 1:1, then gas top-up.
    const sw = await swapDemoCard(input.number, input.pin, input.merchantId);
    const saleId = randomUUID();
    const mintTx = await mintCreditTo(sw.merchantId, input.seller, BigInt(sw.faceCents), saleId);
    const gasTx = await ensureSellerGas(sw.merchantId, input.seller).catch(() => null);
    const sale: Sale = { saleId, seller: input.seller, merchantId: sw.merchantId, faceCents: sw.faceCents, oldLast4: sw.oldLast4, status: "READY_TO_LIST", mintTx, gasTx, createdAt: new Date().toISOString() };
    return sale;
  }
  const swapped = await swapIntoVault(input.number, input.pin, input.merchantId);
  const sale: StoredSale = {
    saleId: randomUUID(),
    seller: input.seller,
    merchantId: swapped.merchantId,
    faceCents: swapped.faceCents,
    oldLast4: swapped.oldLast4,
    status: "SWAPPED",
    vaultNumber: swapped.vaultNumber,
    createdAt: new Date().toISOString(),
  };
  await kv().set(key(sale.saleId), sale);
  return finish(sale);
}

/** Retry a sale whose mint failed after the swap (status SWAPPED). MINTING needs manual review. */
export async function resumeSale(saleId: string, seller: Address) {
  const s = await kv().get<StoredSale>(key(saleId));
  if (!s || s.seller.toLowerCase() !== seller.toLowerCase()) return null;
  if (s.status === "MINTING") throw new Error("This sale is being finalized. If it doesn't complete in a minute, contact support.");
  return finish(s);
}

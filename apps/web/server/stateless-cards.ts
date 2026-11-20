// LANE C. Storage-free simulated store cards (works on any serverless instance).
//  - Demo card: number 7777 MM xxxxxxxxxx (MM = store id), PIN = HMAC(server secret, number). Face = DEMO_FACE_CENTS.
//  - "Swapped" registry lives ON ARC: the issuer mints 1 unit of marker token 999 to an address derived from
//    the card number. balanceOf(marker) > 0  <=>  the card was swapped (its value moved to Sway). One eth_call.
//  - Buyer card: derived from the paid order (see giftcards.cardForOrder).
import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { keccak256, toHex, getAddress, type Address } from "viem";
import { merchantCreditAbi } from "@sway/shared";
import { publicClient, requireDeployment } from "./chain.ts";
import { issuerWallet } from "./issuer.ts";
import { GiftCardError, normalizeNumber, type CardView } from "./giftcards.ts";
import { DEMO_FACE_CENTS } from "../lib/demo.ts";

const MARKER_ID = 999n;

function key() {
  const base = process.env.CARD_VAULT_KEY ?? process.env.ORDER_SIGNING_SECRET;
  if (!base || base.length < 32) throw new Error("CARD_VAULT_KEY (or ORDER_SIGNING_SECRET) must be set.");
  return createHash("sha256").update(`sway-card-vault:${base}`).digest();
}
const digits = (label: string, len: number) => {
  const h = createHmac("sha256", key()).update(label).digest();
  let out = "";
  for (let i = 0; out.length < len; i++) out += (h[i % h.length] % 10).toString();
  return out;
};
const pinFor = (number: string) => digits(`demo-pin:${number}`, 6);
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export const isStatelessDemo = (n: string) => /^7777\d{12}$/.test(normalizeNumber(n));
const merchantOf = (n: string) => Number(normalizeNumber(n).slice(4, 6));
const markerHolder = (n: string): Address => getAddress(`0x${keccak256(toHex(`sway-swapped:${normalizeNumber(n)}`)).slice(26)}`);

export function issueDemoCard(merchantId: number) {
  const rand = Array.from({ length: 10 }, () => randomInt(0, 10)).join("");
  const number = `7777${String(merchantId).padStart(2, "0")}${rand}`;
  return { number, pin: pinFor(number), merchantId, balanceCents: DEMO_FACE_CENTS.toString() };
}

function verify(numberRaw: string, pin: string) {
  const n = normalizeNumber(numberRaw);
  if (!isStatelessDemo(n)) throw new GiftCardError("CARD_NOT_FOUND", "We couldn't find that gift card.");
  if (!same(pinFor(n), pin.trim())) throw new GiftCardError("BAD_PIN", "The PIN doesn't match this card.");
  return n;
}

async function isSwapped(n: string) {
  const d = requireDeployment();
  const bal = await publicClient.readContract({ address: d.merchantCredit, abi: merchantCreditAbi, functionName: "balanceOf", args: [markerHolder(n), MARKER_ID] });
  return bal > 0n;
}

export async function checkDemoBalance(numberRaw: string, pin: string): Promise<CardView> {
  const n = verify(numberRaw, pin);
  const swapped = await isSwapped(n);
  return { last4: n.slice(-4), merchantId: merchantOf(n), balanceCents: swapped ? "0" : DEMO_FACE_CENTS.toString(), status: swapped ? "SWAPPED_OUT" : "ACTIVE" };
}

/** THE SWAP, storage-free: record on Arc that this card's value moved to Sway. Old number reads $0 forever after. */
export async function swapDemoCard(numberRaw: string, pin: string, expectMerchantId: number) {
  const n = verify(numberRaw, pin);
  if (merchantOf(n) !== expectMerchantId) throw new GiftCardError("WRONG_MERCHANT", "This card belongs to a different store.");
  if (await isSwapped(n)) throw new GiftCardError("ZERO_BALANCE", "This card has no balance left.");
  const d = requireDeployment();
  const w = issuerWallet(1);
  const hash = await w.writeContract({
    address: d.merchantCredit,
    abi: merchantCreditAbi,
    functionName: "mintCredit",
    args: [MARKER_ID, markerHolder(n), 1n, keccak256(toHex("sway-swap-marker"))],
  });
  const r = await publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`swap marker reverted (${hash})`);
  return { faceCents: DEMO_FACE_CENTS.toString(), oldLast4: n.slice(-4), merchantId: merchantOf(n), markerTx: hash };
}

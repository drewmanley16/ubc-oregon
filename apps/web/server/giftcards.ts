// LANE C. SIMULATED RETAILER GIFT-CARD SYSTEM for our fictional merchants.
// In production this is the retailer's (or an exchange partner's) gift-card API. Everything here is
// labeled "simulated" in the UI. Money (USDC) never touches this module — it only tracks card records.
//
// The Sway swap (why sellers can't drain a card after listing it):
//   1. Seller submits number + PIN. We check the balance with the "retailer".
//   2. swapIntoVault(): the old card's full balance moves onto a NEW card that only Sway knows.
//      The seller's number is now $0 — anything they saw is worthless.
//   3. Sway mints on-chain credit 1:1 for the vaulted value; the seller lists it.
//   4. When a buyer pays on chain, claimForOrder() assigns one vaulted card of that exact value
//      to the order and only the buyer (wallet signature) can reveal its number + PIN.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { kv } from "./kv.ts";

export type CardStatus = "ACTIVE" | "SWAPPED_OUT";
export type Holder = "PUBLIC" | "SWAY_VAULT";

type StoredCard = {
  number: string; // 16 digits, no spaces
  pinEnc: string; // AES-256-GCM, see seal()
  merchantId: number;
  balanceCents: string;
  status: CardStatus;
  holder: Holder;
  createdAt: string;
  swappedTo?: string; // set on the OLD card: only for audit, never shown to the seller
};

export type CardView = { last4: string; merchantId: number; balanceCents: string; status: CardStatus };

export class GiftCardError extends Error {
  code: "CARD_NOT_FOUND" | "BAD_PIN" | "ZERO_BALANCE" | "BUSY" | "WRONG_MERCHANT" | "NO_VAULT_CARD";
  constructor(code: GiftCardError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

// ── crypto helpers ─────────────────────────────────────────────
function vaultKey() {
  const base = process.env.CARD_VAULT_KEY ?? process.env.ORDER_SIGNING_SECRET;
  if (!base || base.length < 32) throw new Error("CARD_VAULT_KEY (or ORDER_SIGNING_SECRET) must be set, >= 32 chars.");
  return createHash("sha256").update(`sway-card-vault:${base}`).digest();
}
function seal(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", vaultKey(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}
function open(sealed: string) {
  const [iv, tag, ct] = sealed.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = createDecipheriv("aes-256-gcm", vaultKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}
const sameSecret = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

export const normalizeNumber = (n: string) => n.replace(/[\s-]/g, "");
const digits = (len: number) => Array.from({ length: len }, () => randomInt(0, 10)).join("");
/** Simulated cards use the 7777 prefix so they can never be confused with a real card range. */
const newNumber = () => `7777${digits(12)}`;
const newPin = () => digits(6);

const K = {
  card: (n: string) => `gc:card:${n}`,
  lock: (n: string) => `gc:lock:${n}`,
  pool: (m: number, cents: string) => `gc:pool:${m}:${cents}`,
  assigned: (n: string) => `gc:assigned:${n}`,
  claim: (orderId: string) => `gc:claim:${orderId.toLowerCase()}`,
  claimLock: (orderId: string) => `gc:claimlock:${orderId.toLowerCase()}`,
};

const view = (c: StoredCard): CardView => ({
  last4: c.number.slice(-4),
  merchantId: c.merchantId,
  balanceCents: c.balanceCents,
  status: c.status,
});

// ── "retailer" operations ──────────────────────────────────────

/** Retailer issues a new physical/e-gift card to the public (demo button "Get a demo card"). */
export async function issuePublicCard(merchantId: number, balanceCents: bigint, now = new Date()) {
  const number = newNumber();
  const pin = newPin();
  const card: StoredCard = {
    number,
    pinEnc: seal(pin),
    merchantId,
    balanceCents: balanceCents.toString(),
    status: "ACTIVE",
    holder: "PUBLIC",
    createdAt: now.toISOString(),
  };
  await kv().set(K.card(number), card);
  return { number, pin, merchantId, balanceCents: card.balanceCents };
}

async function loadVerified(numberRaw: string, pin: string) {
  const number = normalizeNumber(numberRaw);
  if (!/^\d{12,19}$/.test(number)) throw new GiftCardError("CARD_NOT_FOUND", "That doesn't look like a gift card number.");
  const card = await kv().get<StoredCard>(K.card(number));
  if (!card) throw new GiftCardError("CARD_NOT_FOUND", "We couldn't find that gift card.");
  if (!sameSecret(open(card.pinEnc), pin.trim())) throw new GiftCardError("BAD_PIN", "The PIN doesn't match this card.");
  return card;
}

/** Retailer balance check (public page). */
export async function checkBalance(number: string, pin: string, derivedFaceCents = "100"): Promise<CardView> {
  const d = checkDerived(number, pin, derivedFaceCents);
  if (d) return d;
  return view(await loadVerified(number, pin));
}

/**
 * THE SWAP. Moves the card's entire balance onto a fresh card held in Sway's vault.
 * After this the submitted number shows $0 forever. Returns the vault card (number never leaves the server).
 */
export async function swapIntoVault(numberRaw: string, pin: string, expectMerchantId: number, now = new Date()) {
  const number = normalizeNumber(numberRaw);
  if (!(await kv().setNX(K.lock(number), now.toISOString(), 30)))
    throw new GiftCardError("BUSY", "This card is already being processed.");
  try {
    const old = await loadVerified(number, pin);
    if (old.merchantId !== expectMerchantId)
      throw new GiftCardError("WRONG_MERCHANT", "This card belongs to a different store.");
    if (old.status !== "ACTIVE" || BigInt(old.balanceCents) <= 0n)
      throw new GiftCardError("ZERO_BALANCE", "This card has no balance left.");

    const vault: StoredCard = {
      number: newNumber(),
      pinEnc: seal(newPin()),
      merchantId: old.merchantId,
      balanceCents: old.balanceCents,
      status: "ACTIVE",
      holder: "SWAY_VAULT",
      createdAt: now.toISOString(),
    };
    // Write the new card first, then zero the old one. A crash in between leaves value on BOTH
    // (seller could still spend) — never on neither — and the sale is only minted after both succeed.
    await kv().set(K.card(vault.number), vault);
    await kv().set(K.card(number), { ...old, balanceCents: "0", status: "SWAPPED_OUT", swappedTo: vault.number } satisfies StoredCard);
    return { vaultNumber: vault.number, merchantId: vault.merchantId, faceCents: vault.balanceCents, oldLast4: number.slice(-4) };
  } finally {
    await kv().del(K.lock(number));
  }
}

/** Called only AFTER on-chain credit has been minted for this vault card: makes it buyable. */
export async function addToPool(vaultNumber: string) {
  const c = await kv().get<StoredCard>(K.card(vaultNumber));
  if (!c || c.holder !== "SWAY_VAULT") throw new GiftCardError("CARD_NOT_FOUND", "Vault card missing.");
  await kv().rpush(K.pool(c.merchantId, c.balanceCents), vaultNumber);
}

/**
 * Assigns one vaulted card of exactly `creditCents` to a PAID order (idempotent per orderId).
 * Credit is fungible on chain; every unit minted is backed 1:1 by a vaulted card, so any card of
 * the same merchant + value is an equivalent claim.
 */
export async function claimForOrder(orderId: string, merchantId: number, creditCents: string) {
  const existing = await kv().get<string>(K.claim(orderId));
  if (existing) return existing;
  if (!(await kv().setNX(K.claimLock(orderId), "1", 30))) throw new GiftCardError("BUSY", "Your card is being prepared — try again in a moment.");
  try {
    const again = await kv().get<string>(K.claim(orderId));
    if (again) return again;
    for (const n of await kv().lrange(K.pool(merchantId, creditCents))) {
      if (await kv().setNX(K.assigned(n), orderId.toLowerCase())) {
        await kv().set(K.claim(orderId), n);
        return n;
      }
    }
    throw new GiftCardError("NO_VAULT_CARD", "No vaulted gift card matches this purchase. Contact support.");
  } finally {
    await kv().del(K.claimLock(orderId));
  }
}

/** Full card details for the verified buyer only. */
export async function revealCard(vaultNumber: string) {
  const c = await kv().get<StoredCard>(K.card(vaultNumber));
  if (!c) throw new GiftCardError("CARD_NOT_FOUND", "Card missing.");
  return { number: c.number, pin: open(c.pinEnc), merchantId: c.merchantId, balanceCents: c.balanceCents };
}

// ── Stateless issue-to-buyer (no database) ─────────────────────
// The simulated store issues the buyer a fresh card for a PAID order. Number + PIN are derived with the
// server secret, so they're stable across reloads/instances and only the server can produce them.
const hmacDigits = (label: string, len: number) => {
  const h = createHmac("sha256", vaultKey()).update(label).digest();
  let out = "";
  for (let i = 0; out.length < len; i++) out += (h[i % h.length] % 10).toString();
  return out;
};
const derivedPin = (number: string) => hmacDigits(`pin:${number}`, 6);

export function cardForOrder(orderId: string, merchantId: number, cents: string) {
  const number = `7778${hmacDigits(`card:${orderId.toLowerCase()}:${merchantId}`, 12)}`;
  return { number, pin: derivedPin(number), merchantId, balanceCents: cents };
}

/** Balance check for derived (7778…) cards: valid only with the server-derived PIN. */
export function checkDerived(number: string, pin: string, faceCents: string): CardView | null {
  const n = normalizeNumber(number);
  if (!/^7778\d{12}$/.test(n) || !sameSecret(derivedPin(n), pin.trim())) return null;
  return { last4: n.slice(-4), merchantId: 0, balanceCents: faceCents, status: "ACTIVE" };
}

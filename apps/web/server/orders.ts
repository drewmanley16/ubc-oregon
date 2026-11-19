// LANE C (critical path implemented by lane D on Nov 18; lane C owns going forward).
// Stateless orders (no DB): order payload + HMAC-SHA256(ORDER_SIGNING_SECRET) => token.
// The orderId is a random bytes32, never derived from PII.
// Payment status is NEVER stored here; it is derived from the chain (orderSettled + CheckoutCompleted).
import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CreateOrderRequest, Hex, Order } from "@sway/shared";
import { getMerchantById, PRODUCTS } from "./seed.ts";

export type OrderPayload = Omit<Order, "token">;

export type OrderErrorCode = "MERCHANT_UNKNOWN" | "PRODUCT_UNKNOWN" | "INVALID_CART";

export class OrderError extends Error {
  code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const MAX_QTY = 20;

function secret(): Buffer {
  const s = process.env.ORDER_SIGNING_SECRET;
  if (!s || s.length < 32) throw new Error("ORDER_SIGNING_SECRET must be set (>= 32 chars). See .env.example.");
  return Buffer.from(s, "utf8");
}

const b64u = (b: Buffer) => b.toString("base64url");
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest();

/** Builds an order from SERVER prices only (client prices are never accepted) and signs it. */
export function createOrder(req: CreateOrderRequest, now = new Date()): Order {
  const merchant = getMerchantById(req.merchantId);
  if (!merchant) throw new OrderError("MERCHANT_UNKNOWN", `Unknown merchant ${req.merchantId}`);
  if (req.lines.length === 0) throw new OrderError("INVALID_CART", "Cart is empty");

  const seen = new Set<string>();
  const lines = req.lines.map((l) => {
    if (seen.has(l.productId)) throw new OrderError("INVALID_CART", `Duplicate line ${l.productId}`);
    seen.add(l.productId);
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_QTY)
      throw new OrderError("INVALID_CART", `Invalid quantity for ${l.productId}`);
    const p = PRODUCTS.find((x) => x.id === l.productId && x.merchantId === merchant.id);
    if (!p) throw new OrderError("PRODUCT_UNKNOWN", `Unknown product ${l.productId} for ${merchant.slug}`);
    return { productId: p.id, quantity: l.quantity, priceCents: p.priceCents, name: p.name };
  });
  const totalCents = lines.reduce((s, l) => s + BigInt(l.priceCents) * BigInt(l.quantity), 0n);

  const payload: OrderPayload = {
    orderId: `0x${randomBytes(32).toString("hex")}` as Hex,
    merchantId: merchant.id,
    lines,
    totalCents: totalCents.toString(),
    createdAt: now.toISOString(),
  };
  const body = b64u(Buffer.from(JSON.stringify(payload), "utf8"));
  return { ...payload, token: `${body}.${b64u(sign(body))}` };
}

/** Returns the signed payload, or null if the token is malformed or tampered with. */
export function verifyOrderToken(token: string): OrderPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  const expected = sign(body);
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OrderPayload;
    if (!/^0x[0-9a-f]{64}$/.test(p.orderId) || !/^\d+$/.test(p.totalCents)) return null;
    return p;
  } catch {
    return null;
  }
}

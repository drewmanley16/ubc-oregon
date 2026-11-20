// LANE C owns. Typed client used by pages (lane D). Keep in sync with app/api/**.
import type { Merchant, Order, CreateOrderRequest, MarketplaceListing, OrderStatus, Product, QuoteResponse } from "@sway/shared";

async function j<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  merchants: () => fetch("/api/merchants").then(j<Merchant[]>),
  products: (merchantId: number) => fetch(`/api/merchants/${merchantId}/products`).then(j<Product[]>),
  listings: (merchantId: number) => fetch(`/api/listings?merchantId=${merchantId}`).then(j<MarketplaceListing[]>),
  quote: (merchantId: number, amountCents: string, orderId?: string) =>
    fetch(`/api/quote?merchantId=${merchantId}&amountCents=${amountCents}${orderId ? `&orderId=${orderId}` : ""}`, { cache: "no-store" }).then(
      j<QuoteResponse>,
    ),
  createOrder: (req: CreateOrderRequest) =>
    fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) }).then(j<Order>),
  /** `txHash` is only a lookup hint for the receipt; the server re-verifies it on chain. */
  order: (orderId: string, token: string, txHash?: string) =>
    fetch(`/api/orders/${orderId}?token=${encodeURIComponent(token)}${txHash ? `&tx=${txHash}` : ""}`, { cache: "no-store" }).then(
      j<OrderStatus>,
    ),
};

// ── Gift cards (simulated retailer) ────────────────────────────
export type DemoCard = { number: string; pin: string; merchantId: number; balanceCents: string };
export type CardBalance = { last4: string; merchantId: number; balanceCents: string; status: "ACTIVE" | "SWAPPED_OUT" };
export type Sale = {
  saleId: string;
  seller: string;
  merchantId: number;
  faceCents: string;
  oldLast4: string;
  status: "SWAPPED" | "MINTING" | "READY_TO_LIST";
  mintTx?: string;
  gasTx?: string | null;
};
export type RevealedCard = { number: string; pin: string; merchantId: number; merchantName: string; balanceCents: string; simulated: true };

const post = <T>(url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(j<T>);

export const giftcards = {
  demoCard: (merchantId: number) => post<DemoCard>("/api/demo/cards", { merchantId }),
  balance: (number: string, pin: string) => post<CardBalance>("/api/giftcards/balance", { number, pin }),
  sell: (req: { merchantId: number; number: string; pin: string; seller: string }) => post<Sale>("/api/sell", req),
  reveal: (req: { orderId: string; token: string; tx?: string; signature: string }) => post<RevealedCard>("/api/cards/reveal", req),
};

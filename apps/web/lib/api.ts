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
  quote: (merchantId: number, amountCents: string) =>
    fetch(`/api/quote?merchantId=${merchantId}&amountCents=${amountCents}`, { cache: "no-store" }).then(j<QuoteResponse>),
  createOrder: (req: CreateOrderRequest) =>
    fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) }).then(j<Order>),
  order: (orderId: string, token: string) =>
    fetch(`/api/orders/${orderId}?token=${encodeURIComponent(token)}`, { cache: "no-store" }).then(j<OrderStatus>),
};

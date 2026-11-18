"use client";
// LANE D. Sample cart → POST /api/orders → /checkout/[orderId]?t=<signed token>
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Merchant, Product } from "@sway/shared";
import { ProductCard } from "@/components/sway/ProductCard";
import { Price } from "@/components/sway/Price";
import { api } from "@/lib/api";

export function StoreCart({ merchant, products }: { merchant: Merchant; products: Product[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = products.reduce((s, p) => s + BigInt(p.priceCents), 0n);

  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const order = await api.createOrder({ merchantId: merchant.id, lines: products.map((p) => ({ productId: p.id, quantity: 1 })) });
      router.push(`/checkout/${order.orderId}?t=${encodeURIComponent(order.token)}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid gap-3">
      {products.map((p) => <ProductCard key={p.id} product={p} quantity={1} />)}
      <div className="mt-4 flex items-center justify-between">
        <span>Total <Price cents={total} size="lg" /></span>
        <button onClick={checkout} disabled={busy} className="rounded bg-black px-5 py-3 text-white disabled:opacity-50">
          {busy ? "Starting checkout…" : "Checkout"}
        </button>
      </div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </section>
  );
}

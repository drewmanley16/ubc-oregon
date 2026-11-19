"use client";
// LANE D. Gift card + live quote -> POST /api/orders -> /checkout/[orderId]?t=<signed token>
// The price shown here is advisory; checkout re-checks the listing on chain before paying.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Merchant, type Product } from "@sway/shared";
import { api } from "@/lib/api";
import { Price } from "@/components/sway/Price";
import { copy } from "@/content/copy";

const deployment = getDeployment();

export function GiftCardOffer({ merchant, product }: { merchant: Merchant; product: Product }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["quote", merchant.id, product.priceCents],
    queryFn: () => api.quote(merchant.id, product.priceCents),
    refetchInterval: 15_000,
  });
  const quote = q.data && !("reason" in q.data) ? q.data : null;
  const payCents = quote && deployment ? usdcUnitsToCentsExact(BigInt(quote.askUsdcUnits), deployment.usdcDecimals) : null;

  async function buy() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const order = await api.createOrder({ merchantId: merchant.id, lines: [{ productId: product.id, quantity: 1 }] });
      router.push(`/checkout/${order.orderId}?t=${encodeURIComponent(order.token)}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid gap-4 rounded border p-5">
      <div className="text-sm uppercase tracking-wide opacity-60">{copy.store.giftCard}</div>
      <h2 className="text-xl font-medium">{product.name}</h2>
      {product.description && <p className="opacity-70">{product.description}</p>}
      <div className="flex items-baseline gap-3">
        <span className={payCents !== null ? "line-through opacity-60" : ""}>
          <Price cents={product.priceCents} size="lg" />
        </span>
        {payCents !== null && quote && (
          <>
            <span className="text-2xl font-semibold">{copy.store.withSway(formatCents(payCents))}</span>
            <span className="text-green-700">{copy.store.youSave(formatCents(quote.grossSavingsCents))}</span>
          </>
        )}
      </div>
      {q.isLoading && <p className="opacity-70">{copy.store.checking}</p>}
      {q.data && "reason" in q.data && <p className="opacity-70">{q.data.message || copy.store.noOffer}</p>}
      <button onClick={() => void buy()} disabled={busy || !quote} className="rounded bg-black px-5 py-4 text-lg text-white disabled:opacity-50">
        {busy ? copy.store.starting : copy.store.buy}
      </button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </section>
  );
}

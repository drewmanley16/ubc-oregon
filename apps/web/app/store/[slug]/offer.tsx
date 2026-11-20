"use client";
// LANE D. Gift card + live quote -> POST /api/orders -> /checkout/[orderId]?t=<signed token>
// The price shown here is advisory; checkout re-checks the listing on chain before paying.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Merchant, type Product } from "@sway/shared";
import { api } from "@/lib/api";
import { TopBar } from "@/components/sway/TopBar";
import { GiftCard } from "@/components/sway/GiftCard";
import { Icon } from "@/components/sway/Icon";
import { copy } from "@/content/copy";

const deployment = getDeployment();
const whole = (c: bigint | string) => formatCents(c).replace(".00", "");

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
    <>
      <div className="scroll fresh">
        <TopBar back="/" />
        <div className="store-title">
          <h2>{merchant.name}</h2>
          <p>{merchant.tagline}</p>
        </div>
        <div className="gwrap">
          <GiftCard merchant={merchant} valueCents={product.priceCents} />
        </div>
        <div className="offer">
          {q.isLoading ? (
            <>
              <div className="skel" style={{ height: 20, width: 80, marginTop: 8 }} />
              <div className="skel" style={{ height: 44, width: 200, margin: "8px 0 10px" }} />
            </>
          ) : payCents !== null && quote ? (
            <>
              <div className="was">{formatCents(product.priceCents)}</div>
              <div className="now">
                {whole(payCents)} <span>with Sway</span>
              </div>
              <span className="saveline">
                <Icon name="check" />
                {copy.store.youSave(whole(quote.grossSavingsCents))}
              </span>
            </>
          ) : (
            <div className="now">{whole(product.priceCents)}</div>
          )}
        </div>
        {q.data && "reason" in q.data ? (
          <div className="note calm">
            <b>
              <Icon name="info" />
              No discounted cards right now
            </b>
            <p>{q.data.message || copy.store.noOffer}</p>
          </div>
        ) : (
          <div className="note calm">
            <b>
              <Icon name="lock" />
              Can&apos;t be used up before you get it
            </b>
            <p>The seller&apos;s card was moved to a new number only Sway holds. After you pay, that number is yours alone.</p>
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <div className="dock">
        <button className="cta" onClick={() => void buy()} disabled={busy || !quote}>
          <span>
            {busy && <i className="spin" />}
            {busy ? copy.store.starting : copy.store.buy}
          </span>
        </button>
      </div>
    </>
  );
}

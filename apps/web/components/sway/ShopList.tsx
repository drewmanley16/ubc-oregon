"use client";
// Shop rows with the LIVE best deal per shop (real on-chain quotes; never a made-up number).
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { formatCents, type Merchant } from "@sway/shared";
import { api } from "@/lib/api";
import { Mark } from "./Mark";
import { Icon } from "./Icon";
import { copy } from "@/content/copy";
import { DEMO_FACE_CENTS } from "@/lib/demo";

const FACE = DEMO_FACE_CENTS.toString();

export function ShopList({ merchants }: { merchants: Merchant[] }) {
  const quotes = useQueries({
    queries: merchants.map((m) => ({ queryKey: ["quote", m.id, FACE], queryFn: () => api.quote(m.id, FACE), refetchInterval: 15_000 })),
  });
  return (
    <div className="shops">
      {merchants.map((m, i) => {
        const q = quotes[i].data;
        const deal = q && !("reason" in q) ? q : null;
        return (
          <Link key={m.id} href={`/store/${m.slug}`} className="shop" style={{ textDecoration: "none", color: "inherit" }}>
            <Mark merchant={m} />
            <span className="t">
              <b>{m.name}</b>
              {deal ? (
                <small className="deal">{copy.landing.shopDeal(formatCents(deal.grossSavingsCents))}</small>
              ) : (
                <small>{quotes[i].isLoading ? m.tagline : copy.landing.shopNoDeal}</small>
              )}
            </span>
            <Icon name="right" />
          </Link>
        );
      })}
    </div>
  );
}

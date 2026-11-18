// LANE B styles. Props contract shared with lane D.
import Link from "next/link";
import type { Merchant } from "@sway/shared";

export function MerchantCard({ merchant, bestSavingsCents }: { merchant: Merchant; bestSavingsCents?: string }) {
  return (
    <Link href={`/store/${merchant.slug}`} className="block rounded border p-4">
      <h3>{merchant.name}</h3>
      {merchant.tagline && <p>{merchant.tagline}</p>}
      {bestSavingsCents && <p>Save up to {bestSavingsCents} cents</p>}
    </Link>
  );
}

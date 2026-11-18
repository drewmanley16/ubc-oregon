// LANE B styles. Props contract shared with lane D. The hero of the checkout: savings must read in < 5s.
import type { CheckoutQuote } from "@sway/shared";
import { Price } from "./Price";

export type QuoteCardProps = {
  quote: CheckoutQuote;
  /** ask converted to cents by lane D via usdcUnitsToCentsExact */
  payCents: string;
  secondsLeft: number;
};

export function QuoteCard({ quote, payCents, secondsLeft }: QuoteCardProps) {
  return (
    <section className="rounded border p-4">
      <div>Order total <Price cents={quote.faceValueCents} strike /></div>
      <div>You pay <Price cents={payCents} size="xl" /></div>
      <div>You save <Price cents={quote.grossSavingsCents} /></div>
      <small>Listing #{quote.listingId} · held {secondsLeft}s</small>
    </section>
  );
}

// LANE C. Pure quote selection (spec §6). No I/O here so it is unit-testable.
import { type CheckoutQuote, type Hex, type MarketplaceListing } from "@sway/shared";

/** Active, same merchant, exact cover, ask > 0; cheapest first, then oldest listing (FIFO). */
export function selectListing(listings: MarketplaceListing[], merchantId: number, amountCents: bigint) {
  const candidates = listings
    .filter(
      (l) =>
        l.status === "ACTIVE" &&
        l.merchantId === merchantId &&
        BigInt(l.faceValueCents) === amountCents &&
        BigInt(l.askUsdcUnits) > 0n,
    )
    .sort((a, b) => {
      const d = BigInt(a.askUsdcUnits) - BigInt(b.askUsdcUnits);
      if (d !== 0n) return d < 0n ? -1 : 1;
      const i = BigInt(a.listingId) - BigInt(b.listingId);
      return i < 0n ? -1 : i > 0n ? 1 : 0;
    });
  return candidates[0] ?? null;
}

/** face - ask, with the ask rounded UP to a whole cent, so we never overstate savings. */
export function conservativeSavingsCents(faceCents: bigint, askUsdcUnits: bigint, usdcDecimals: number) {
  const per = 10n ** BigInt(usdcDecimals - 2);
  return faceCents - (askUsdcUnits + per - 1n) / per;
}

export const QUOTE_TTL_MS = 60_000;

export function buildQuote(
  l: MarketplaceListing,
  opts: { orderId: Hex; chainId: number; usdcDecimals: number; now?: Date },
): CheckoutQuote {
  const now = opts.now ?? new Date();
  return {
    quoteId: `${l.listingId}-${now.getTime()}`,
    merchantId: l.merchantId,
    orderId: opts.orderId,
    listingId: l.listingId,
    faceValueCents: l.faceValueCents,
    askUsdcUnits: l.askUsdcUnits,
    grossSavingsCents: conservativeSavingsCents(BigInt(l.faceValueCents), BigInt(l.askUsdcUnits), opts.usdcDecimals).toString(),
    currency: "USDC",
    chainId: opts.chainId,
    expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
    executable: true,
  };
}

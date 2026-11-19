// LANE C. GET /api/quote?merchantId=N&amountCents=X[&orderId=0x..] -> QuoteResponse
// Algorithm (spec §6): Active listings for merchant with creditCents == amountCents and ask > 0,
// sort by askUsdcUnits asc then listingId asc. None => NoQuote{reason:"NO_LISTING"}. Never fabricate.
// The quote is ADVISORY; the on-chain maxUsdcUnits guard is what protects the buyer.
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Hex, NoQuote } from "@sway/shared";
import { apiError } from "@/server/http";
import { readListings, requireDeployment } from "@/server/chain";
import { getMerchantById } from "@/server/seed";
import { buildQuote, selectListing } from "@/server/quote";

export const dynamic = "force-dynamic";

const ZERO_ORDER = `0x${"0".repeat(64)}` as Hex;
const Query = z.object({
  merchantId: z.coerce.number().int().positive(),
  amountCents: z.string().regex(/^[1-9]\d{0,12}$/),
  orderId: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(),
});
const noStore = { headers: { "cache-control": "no-store" } };

export async function GET(req: NextRequest) {
  const q = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!q.success) return apiError(400, "BAD_REQUEST", "merchantId and amountCents (positive integer string) are required");
  const { merchantId, amountCents, orderId } = q.data;

  if (!getMerchantById(merchantId)) {
    const body: NoQuote = { executable: false, reason: "MERCHANT_UNKNOWN", message: "We don't know this store." };
    return Response.json(body, noStore);
  }
  try {
    const d = requireDeployment();
    const best = selectListing(await readListings(merchantId), merchantId, BigInt(amountCents));
    if (!best) {
      const body: NoQuote = { executable: false, reason: "NO_LISTING", message: "No savings available for this cart right now." };
      return Response.json(body, noStore);
    }
    return Response.json(
      buildQuote(best, { orderId: (orderId as Hex | undefined) ?? ZERO_ORDER, chainId: d.chainId, usdcDecimals: d.usdcDecimals }),
      noStore,
    );
  } catch (e) {
    console.error("quote: chain read failed", e);
    const body: NoQuote = { executable: false, reason: "CHAIN_UNAVAILABLE", message: "Couldn't reach the Arc network. Try again in a moment." };
    return Response.json(body, { status: 503, ...noStore });
  }
}

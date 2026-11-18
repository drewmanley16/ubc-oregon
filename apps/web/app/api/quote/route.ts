// LANE C. GET /api/quote?merchantId=N&amountCents=X -> QuoteResponse
// Algorithm (spec §6): Active listings for merchant with creditCents == amountCents and ask > 0,
// sort by askUsdcUnits asc then listingId asc. None => NoQuote{reason:"NO_LISTING"}. Never fabricate.
// The quote is ADVISORY; the on-chain maxUsdcUnits guard is what protects the buyer.
import { notImplemented } from "@/server/http";

export function GET() {
  return notImplemented("GET /api/quote");
}

// LANE C. GET /api/listings?merchantId=N -> MarketplaceListing[]  (source of truth: chain)
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/server/http";
import { readListings } from "@/server/chain";

export const dynamic = "force-dynamic";

const Query = z.object({ merchantId: z.coerce.number().int().positive().optional() });

export async function GET(req: NextRequest) {
  const q = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!q.success) return apiError(400, "BAD_REQUEST", "merchantId must be a positive integer");
  try {
    return Response.json(await readListings(q.data.merchantId), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("listings: chain read failed", e);
    return apiError(503, "CHAIN_UNAVAILABLE", "Couldn't reach the Arc network. Try again in a moment.");
  }
}

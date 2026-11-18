// LANE C. GET /api/merchants/:id/products — source of truth: server/seed.ts
import type { NextRequest } from "next/server";
import { getMerchantById, getProducts } from "@/server/seed";
import { apiError } from "@/server/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/merchants/[id]/products">) {
  const { id } = await ctx.params;
  const merchantId = Number(id);
  if (!getMerchantById(merchantId)) return apiError(404, "MERCHANT_UNKNOWN", `No merchant ${id}`);
  return Response.json(getProducts(merchantId));
}

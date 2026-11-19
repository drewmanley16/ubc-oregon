// LANE C. GET /api/orders/:orderId?token=...[&tx=0x..] -> OrderStatus
// PAID only if a confirmed CheckoutCompleted(orderId) log exists in a successful tx. Never trust the client:
// `tx` is only a lookup hint and is fully re-verified on chain (see findCheckoutReceipt).
import type { NextRequest } from "next/server";
import type { Hex, OrderStatus } from "@sway/shared";
import { apiError } from "@/server/http";
import { verifyOrderToken } from "@/server/orders";
import { findCheckoutReceipt, isOrderSettled } from "@/server/chain";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };

export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const tx = req.nextUrl.searchParams.get("tx");
  const order = verifyOrderToken(token);
  if (!order || order.orderId.toLowerCase() !== id.toLowerCase())
    return apiError(401, "BAD_TOKEN", "This order link is invalid or has been tampered with.");
  const txHint = tx && /^0x[0-9a-fA-F]{64}$/.test(tx) ? (tx as Hex) : undefined;

  try {
    if (!(await isOrderSettled(order.orderId))) {
      const body: OrderStatus = { state: "UNPAID", order };
      return Response.json(body, noStore);
    }
    const receipt = await findCheckoutReceipt(order.orderId, txHint);
    if (!receipt) {
      // Settled on chain but receipt not located (outside scan window, no hint). Don't claim PAID without it.
      return apiError(409, "RECEIPT_NOT_FOUND", "This order was paid on chain, but we couldn't load its receipt yet.");
    }
    if (receipt.merchantId !== order.merchantId || BigInt(receipt.creditCents) !== BigInt(order.totalCents))
      return apiError(409, "RECEIPT_MISMATCH", "The on-chain payment doesn't match this order.");
    const body: OrderStatus = { state: "PAID", order, receipt };
    return Response.json(body, noStore);
  } catch (e) {
    console.error("orders/:id: chain read failed", e);
    return apiError(503, "CHAIN_UNAVAILABLE", "Couldn't reach the Arc network. Try again in a moment.");
  }
}

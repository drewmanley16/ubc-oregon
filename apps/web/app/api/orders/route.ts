// LANE C. POST /api/orders  body: CreateOrderRequest -> Order (with signed token)
// Prices come from server/seed.ts only; any client-sent price fields are ignored.
import { z } from "zod";
import { apiError } from "@/server/http";
import { createOrder, OrderError } from "@/server/orders";

const Body = z.object({
  merchantId: z.number().int().positive(),
  lines: z.array(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const b = Body.safeParse(json);
  if (!b.success) return apiError(400, "BAD_REQUEST", "Invalid order: expected { merchantId, lines: [{ productId, quantity }] }");
  try {
    return Response.json(createOrder(b.data), { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return apiError(e.code === "MERCHANT_UNKNOWN" ? 404 : 400, e.code, e.message);
    console.error("orders: create failed", (e as Error).message);
    return apiError(500, "INTERNAL", "Couldn't create the order.");
  }
}

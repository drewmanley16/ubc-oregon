// LANE C. GET /api/orders/:orderId?token=... -> OrderStatus
// PAID only if a confirmed CheckoutCompleted(orderId) log exists. Never trust the client.
import { notImplemented } from "@/server/http";

export function GET() {
  return notImplemented("GET /api/orders/:id");
}

// LANE C. Stateless orders (no DB): order payload + HMAC-SHA256(ORDER_SIGNING_SECRET) => token.
// The orderId is a random bytes32 (crypto.getRandomValues), never derived from PII.
// Payment status is NEVER stored here; it is derived from the chain (orderSettled + CheckoutCompleted).
import "server-only";
import type { CreateOrderRequest, Order } from "@sway/shared";

export function createOrder(_req: CreateOrderRequest): Order {
  // TODO(lane-C): validate lines against server/seed.ts prices (never trust client prices),
  // compute totalCents with bigint, random orderId, sign payload -> token.
  throw new Error("TODO(lane-C): createOrder");
}

export function verifyOrderToken(_token: string): Omit<Order, "token"> | null {
  // TODO(lane-C): constant-time HMAC compare (crypto.timingSafeEqual); return null if invalid.
  throw new Error("TODO(lane-C): verifyOrderToken");
}

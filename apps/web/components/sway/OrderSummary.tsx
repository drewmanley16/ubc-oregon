// LANE B styles. Props contract shared with lane D.
import type { Order } from "@sway/shared";
import { Price } from "./Price";

export function OrderSummary({ order }: { order: Pick<Order, "lines" | "totalCents"> }) {
  return (
    <section className="rounded border p-4">
      {order.lines.map((l) => (
        <div key={l.productId}>{l.name} × {l.quantity} — <Price cents={(BigInt(l.priceCents) * BigInt(l.quantity)).toString()} /></div>
      ))}
      <div>Total: <Price cents={order.totalCents} /></div>
    </section>
  );
}

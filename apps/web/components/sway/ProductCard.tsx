// LANE B styles. Props contract shared with lane D.
import type { Product } from "@sway/shared";
import { Price } from "./Price";

export function ProductCard({ product, quantity, onChange }: { product: Product; quantity: number; onChange?: (q: number) => void }) {
  return (
    <div className="rounded border p-4">
      <h4>{product.name}</h4>
      <Price cents={product.priceCents} />
      <span> × {quantity}</span>
      {onChange && <button onClick={() => onChange(quantity + 1)}>+</button>}
    </div>
  );
}

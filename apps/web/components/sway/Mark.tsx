import type { Merchant } from "@sway/shared";
import { brandOf } from "@/lib/brand";

export function Mark({ merchant, size }: { merchant: Merchant; size?: number }) {
  return (
    <span className="mark" style={{ background: brandOf(merchant.id).color, ...(size ? { width: size, height: size } : {}) }}>
      {merchant.name[0]}
    </span>
  );
}

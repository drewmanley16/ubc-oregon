// LANE B styles. Props contract shared with lane D — change props only with lane D sign-off.
import { formatCents } from "@sway/shared";

export function Price({ cents, strike = false, size = "md" }: { cents: string | bigint; strike?: boolean; size?: "sm" | "md" | "lg" | "xl" }) {
  return <span data-size={size} className={strike ? "line-through opacity-60" : undefined}>{formatCents(cents)}</span>;
}

// LANE C. Run: pnpm --filter @sway/web test   (use RELATIVE imports in tests; "@/..." alias is Next-only)
import { test } from "node:test";
import assert from "node:assert/strict";
import { MERCHANTS, getProducts } from "./seed.ts";

test("every demo merchant has a cart totaling exactly $100.00 (exact-cover for the seeded listing)", () => {
  for (const m of MERCHANTS) {
    const total = getProducts(m.id).reduce((s, p) => s + BigInt(p.priceCents), 0n);
    assert.equal(total, 10_000n, m.slug);
  }
});

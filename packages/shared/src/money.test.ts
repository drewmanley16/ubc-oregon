import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToUsdcUnits, formatCents, grossSavingsCents, parseIntString, usdcUnitsToCentsExact } from "./money.ts";

test("demo math: $100 face, 88 USDC ask => $12 savings", () => {
  assert.equal(grossSavingsCents(10_000n, 88_000_000n, 6), 1_200n);
});
test("cents <-> units round trip at 6dp", () => {
  assert.equal(centsToUsdcUnits(8_800n, 6), 88_000_000n);
  assert.equal(usdcUnitsToCentsExact(88_000_000n, 6), 8_800n);
});
test("sub-cent units are rejected, not rounded", () => {
  assert.throws(() => usdcUnitsToCentsExact(88_000_001n, 6));
});
test("formatCents", () => {
  assert.equal(formatCents("10000"), "$100.00");
  assert.equal(formatCents(1_200n), "$12.00");
  assert.equal(formatCents(123_456_7n), "$12,345.67");
});
test("parseIntString is strict", () => {
  assert.equal(parseIntString("10000"), 10_000n);
  for (const bad of ["", "1.5", "-1", " 1", "1e3"]) assert.throws(() => parseIntString(bad));
});

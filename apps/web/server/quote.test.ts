// LANE C. Run: pnpm --filter @sway/web test
import { test } from "node:test";
import assert from "node:assert/strict";
import type { MarketplaceListing } from "@sway/shared";
import { buildQuote, conservativeSavingsCents, selectListing } from "./quote.ts";

const L = (o: Partial<MarketplaceListing>): MarketplaceListing => ({
  listingId: "1",
  merchantId: 1,
  sellerAddress: "0x0000000000000000000000000000000000000001",
  faceValueCents: "10000",
  askUsdcUnits: "88000000",
  sellerPayoutUnits: "85000000",
  status: "ACTIVE",
  txHash: null,
  ...o,
});

test("picks the cheapest", () => {
  const best = selectListing([L({ listingId: "1", askUsdcUnits: "90000000" }), L({ listingId: "2" })], 1, 10000n);
  assert.equal(best?.listingId, "2");
});

test("ties go to the oldest listing (FIFO), comparing ids numerically", () => {
  const best = selectListing([L({ listingId: "10" }), L({ listingId: "9" })], 1, 10000n);
  assert.equal(best?.listingId, "9");
});

test("ignores wrong merchant, wrong amount, inactive, zero ask", () => {
  const ls = [
    L({ listingId: "1", merchantId: 2 }),
    L({ listingId: "2", faceValueCents: "5000" }),
    L({ listingId: "3", status: "FILLED" }),
    L({ listingId: "4", status: "CANCELLED" }),
    L({ listingId: "5", askUsdcUnits: "0" }),
  ];
  assert.equal(selectListing(ls, 1, 10000n), null);
  assert.equal(selectListing([], 1, 10000n), null);
});

test("quote carries exact integer savings and a 60s expiry", () => {
  const now = new Date("2026-11-19T00:00:00Z");
  const q = buildQuote(L({}), { orderId: `0x${"ab".repeat(32)}`, chainId: 5042002, usdcDecimals: 6, now });
  assert.equal(q.grossSavingsCents, "1200");
  assert.equal(q.expiresAt, "2026-11-19T00:01:00.000Z");
  assert.equal(q.executable, true);
});

test("savings never overstated when ask has sub-cent units", () => {
  assert.equal(conservativeSavingsCents(10000n, 88_000_001n, 6), 1199n);
});

// LANE C. Run: pnpm --filter @sway/web test
import { test, before } from "node:test";
import assert from "node:assert/strict";

before(() => {
  process.env.ORDER_SIGNING_SECRET = "test-secret-test-secret-test-secret-0123";
});
const load = () => import("./orders.ts");

test("createOrder uses server prices and integer totals; token round-trips", async () => {
  const { createOrder, verifyOrderToken } = await load();
  const o = createOrder({ merchantId: 1, lines: [{ productId: "dbc-gc-10", quantity: 1 }] });
  assert.equal(o.totalCents, "1000");
  assert.match(o.orderId, /^0x[0-9a-f]{64}$/);
  const v = verifyOrderToken(o.token);
  assert.ok(v);
  assert.equal(v.orderId, o.orderId);
  assert.equal(v.totalCents, "1000");
});

test("client-sent prices are ignored", async () => {
  const { createOrder } = await load();
  const o = createOrder({ merchantId: 1, lines: [{ productId: "dbc-gc-10", quantity: 2, priceCents: "1" } as never] });
  assert.equal(o.totalCents, "2000");
});

test("orderIds are unique", async () => {
  const { createOrder } = await load();
  const req = { merchantId: 1, lines: [{ productId: "dbc-gc-10", quantity: 1 }] };
  assert.notEqual(createOrder(req).orderId, createOrder(req).orderId);
});

test("tampered tokens are rejected", async () => {
  const { createOrder, verifyOrderToken } = await load();
  const o = createOrder({ merchantId: 1, lines: [{ productId: "dbc-gc-10", quantity: 1 }] });
  const [body, mac] = o.token.split(".");
  const p = JSON.parse(Buffer.from(body, "base64url").toString());
  p.totalCents = "1";
  const forged = `${Buffer.from(JSON.stringify(p)).toString("base64url")}.${mac}`;
  assert.equal(verifyOrderToken(forged), null);
  assert.equal(verifyOrderToken(`${body}.${mac.slice(0, -2)}AA`), null);
  assert.equal(verifyOrderToken("garbage"), null);
  assert.equal(verifyOrderToken(""), null);
});

test("unknown merchant / product from another merchant / bad quantity are rejected", async () => {
  const { createOrder, OrderError } = await load();
  assert.throws(() => createOrder({ merchantId: 99, lines: [{ productId: "dbc-gc-10", quantity: 1 }] }), OrderError);
  assert.throws(() => createOrder({ merchantId: 2, lines: [{ productId: "dbc-gc-10", quantity: 1 }] }), OrderError);
  assert.throws(() => createOrder({ merchantId: 1, lines: [{ productId: "dbc-gc-10", quantity: 0 }] }), OrderError);
  assert.throws(() => createOrder({ merchantId: 1, lines: [] }), OrderError);
});

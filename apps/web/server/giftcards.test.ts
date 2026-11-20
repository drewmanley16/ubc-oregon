// LANE C. Run: pnpm --filter @sway/web test
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MemoryKV, setKV } from "./kv.ts";
import {
  GiftCardError,
  addToPool,
  checkBalance,
  claimForOrder,
  issuePublicCard,
  revealCard,
  swapIntoVault,
} from "./giftcards.ts";

process.env.ORDER_SIGNING_SECRET = "test-secret-test-secret-test-secret-0123";
beforeEach(() => setKV(new MemoryKV()));

const code = (c: string) => (e: unknown) => e instanceof GiftCardError && e.code === c;

test("issued card checks out with the right PIN only", async () => {
  const c = await issuePublicCard(1, 10_000n);
  assert.match(c.number, /^7777\d{12}$/);
  const v = await checkBalance(c.number, c.pin);
  assert.equal(v.balanceCents, "10000");
  assert.equal(v.status, "ACTIVE");
  await assert.rejects(checkBalance(c.number, "000000x"), code("BAD_PIN"));
  await assert.rejects(checkBalance("7777000000000000", c.pin), code("CARD_NOT_FOUND"));
});

test("swap drains the seller's number to $0 and moves value to a new vault card", async () => {
  const c = await issuePublicCard(1, 10_000n);
  const s = await swapIntoVault(c.number.replace(/(\d{4})/g, "$1 ").trim(), c.pin, 1); // spaces tolerated
  assert.equal(s.faceCents, "10000");
  assert.notEqual(s.vaultNumber, c.number);
  const old = await checkBalance(c.number, c.pin);
  assert.equal(old.balanceCents, "0");
  assert.equal(old.status, "SWAPPED_OUT");
  const vault = await revealCard(s.vaultNumber);
  assert.equal(vault.balanceCents, "10000");
  assert.notEqual(vault.pin, c.pin);
});

test("a card can't be swapped twice, or for the wrong store", async () => {
  const c = await issuePublicCard(1, 10_000n);
  await assert.rejects(swapIntoVault(c.number, c.pin, 2), code("WRONG_MERCHANT"));
  await swapIntoVault(c.number, c.pin, 1);
  await assert.rejects(swapIntoVault(c.number, c.pin, 1), code("ZERO_BALANCE"));
});

test("claims are idempotent per order and never hand one card to two orders", async () => {
  for (let i = 0; i < 2; i++) {
    const c = await issuePublicCard(1, 10_000n);
    await addToPool((await swapIntoVault(c.number, c.pin, 1)).vaultNumber);
  }
  const a = await claimForOrder("0xAA", 1, "10000");
  assert.equal(await claimForOrder("0xaa", 1, "10000"), a);
  const b = await claimForOrder("0xBB", 1, "10000");
  assert.notEqual(a, b);
  await assert.rejects(claimForOrder("0xCC", 1, "10000"), code("NO_VAULT_CARD"));
  await assert.rejects(claimForOrder("0xDD", 1, "5000"), code("NO_VAULT_CARD"));
});

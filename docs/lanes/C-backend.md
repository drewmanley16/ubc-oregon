# Lane C — Backend (API route handlers, quote, orders, chain reads, receipts)

Read: `AGENTS.md`, spec §6 (API contract + quoting algorithm), §8 "Member C".
Backend = **Next.js route handlers in `apps/web`** (same origin, deploys with the frontend). No separate service, **no database**.

## Owns
`apps/web/app/api/**` · `apps/web/server/**` · `apps/web/lib/api.ts` · backend tests (put them in `apps/web/server/*.test.ts`, run with `node --test --experimental-strip-types`).

## Don't touch
Contracts, pages, wallet, copy, styles. Need a type change in `packages/shared/src/types.ts`? PR it and tag lane D.

## Contracts you implement against
- Types: `packages/shared/src/types.ts` (`MarketplaceListing`, `CheckoutQuote`, `QuoteResponse`, `Order`, `OrderStatus`, `CheckoutReceipt`, `ApiError`).
- ABIs: `import { swayMarketplaceAbi, merchantCreditAbi } from "@sway/shared"`. Events you index: `ListingCreated`, `ListingCancelled`, `CheckoutCompleted` (see `ISwayMarketplace.sol`).
- Addresses: `requireDeployment()` in `server/chain.ts` (reads `packages/contracts/deployments/arc-testnet.json`).
- Money: `packages/shared/src/money.ts` — bigint only.

**Before lane D deploys:** develop against a local anvil chain. Ask D for (or run) `anvil` + `forge script script/Deploy.s.sol --rpc-url anvil --broadcast` once contracts land, and set `ARC_RPC_URL=http://127.0.0.1:8545`. Until then, unit-test pure logic (quote selection, token signing) with fixtures.

## Tasks

- [x] `GET /api/merchants`, `GET /api/merchants/:id/products` (seeded from `server/seed.ts`).
- [ ] **Orders (no DB):** `server/orders.ts` — `createOrder` validates lines against seed prices (ignore client prices), `totalCents` via bigint, random 32-byte `orderId`, HMAC-SHA256 token over canonical JSON with `ORDER_SIGNING_SECRET`; `verifyOrderToken` with `timingSafeEqual`. Wire `POST /api/orders`.
- [ ] **Listings:** `readActiveListings(merchantId)` in `server/chain.ts` — multicall `getListing(i)` for `i ∈ [1, nextListingId)`; map status enum (1 Active, 2 Filled, 3 Cancelled); `txHash` from `ListingCreated` logs. Wire `GET /api/listings`.
- [ ] **Quote:** `GET /api/quote` per spec §6: filter Active + same merchant + `creditCents == amountCents` + ask > 0; sort ask asc, id asc; `grossSavingsCents` via `grossSavingsCents()`; `expiresAt` = now+60s; `chainId` from deployment. No match → `NoQuote{reason:"NO_LISTING"}` (HTTP 200). RPC down → `CHAIN_UNAVAILABLE` (HTTP 503). **Never fabricate.**
- [ ] **Order status/receipt:** `GET /api/orders/:id?token=` — verify token; `orderSettled(orderId)` on chain; if true, fetch `CheckoutCompleted` log (filter by indexed `orderId`, from `deployBlock`), confirm tx receipt `status==="success"`, return `PAID` + `CheckoutReceipt` with `explorerUrl` from `explorerTxUrl()`. Else `UNPAID`.
- [ ] Validate all query/body params with zod; errors use `apiError()` shape.
- [ ] Tests: quote selection (cheapest, tie-break, wrong merchant, wrong amount, none), token tamper rejected, totals integer-exact.
- [ ] `.env.example` entries for anything new.
- [ ] Stretch (if capacity, coordinate with D): wire `/receipt/[orderId]` page to `api.order()`.

## Must never
Report PAID without a confirmed chain receipt · trust client-sent prices · use floats · log secrets.

## Done when
`curl /api/quote?merchantId=1&amountCents=10000` returns the real seeded Arc listing; after a buyer checkout it returns `NO_LISTING`, and `/api/orders/:id` returns `PAID` with the real tx hash.

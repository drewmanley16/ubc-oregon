# Lane D — Tech lead (contracts, chain, wallet, frontend integration, ship)

**You are on the critical path.** Nothing else matters if `checkout` doesn't settle on Arc.
Read: `AGENTS.md`, spec §5 (contract design + invariants), §9 (build order), §10 (tests).

## Owns
`packages/contracts/**` · `apps/web/app/**/page.tsx` · `app/providers.tsx` · `app/layout.tsx` ·
`lib/wallet/**` · `lib/tx/**` · `lib/contracts.ts` · `.github/**` · root config · README · Devpost submission.

## Don't touch
`app/api/**`, `server/**`, `lib/api.ts` (C) · `content/copy.ts` (A) · `globals.css`, `components/ui/**`, styling (B).

## Inputs you depend on
- C: `/api/quote`, `/api/orders`, `/api/orders/:id` per `packages/shared/src/types.ts`. Until ready, call chain directly or mock.
- A: state matrix + copy in `content/copy.ts`. B: styled `components/sway/*`.

## Tasks (in order — vertical slice first)

### Phase 0 — Arc spike (≤60 min)
- [ ] Generate 4 fresh keys with `cast wallet new` (deployer/admin, merchant-1 issuer, seller, buyer). Put in `packages/contracts/.env` (gitignored). **Not** anvil defaults.
- [ ] Fund each from https://faucet.circle.com (Arc Testnet, USDC). Buyer needs ≥ 89 USDC (88 + gas).
- [ ] `cast chain-id --rpc-url https://rpc.testnet.arc.io` == 5042002; `cast call 0x3600000000000000000000000000000000000000 "decimals()(uint8)"` == 6.
- [ ] Spike an ERC-20 `transferFrom` of official USDC between two test wallets. If it fails → set `USDC_ADDRESS` empty to deploy MockUSDC, note in STATUS.
- [ ] Gate: if Arc blocks you > 1 h, switch to another EVM testnet and **drop the Arc chain award** (spec §2).

### Phase 1 — Contracts (gate: T+6h)
- [ ] Implement `MerchantCredit.sol` against `IMerchantCredit` (remove `NotImplemented`).
- [ ] Implement `SwayMarketplace.sol` against `ISwayMarketplace` — checkout steps 1–7 in that exact order.
- [ ] Un-skip and implement every test in `test/*.t.sol` (32 listed; all required by spec §10). Add an invariant handler.
- [ ] `Deploy.s.sol`: deploy, grant `REDEEMER_ROLE`, register merchants 1–3, assert USDC decimals == 6, write `deployments/arc-testnet.json`.
- [ ] `SeedDemo.s.sol`: mint $100 Daybreak credit → seller; seller lists for 88 USDC. Must be re-runnable (new listing each run).
- [ ] Deploy to Arc; record addresses + explorer links in README + STATUS. `pnpm abi`.

### Phase 2 — First buyer transaction (gate: T+12h)
- [ ] Privy: create app at dashboard.privy.io, add Arc testnet as custom chain, `NEXT_PUBLIC_PRIVY_APP_ID`. Login methods email/google/passkey (+wallet secondary). Embedded wallet created on login.
- [ ] Implement `useSwayWallet()` with Privy + `@privy-io/wagmi`; wire `providers.tsx`.
- [ ] Store page → `POST /api/orders` → `/checkout/[orderId]?t=<token>`.
- [ ] Checkout page drives `CheckoutPhase` (lib/tx/types.ts): quote → re-read `getListing` on chain → balance/allowance → `approve` (exact ask) → `checkout(listingId, orderId, merchantId, maxUsdcUnits=ask, expectedCreditCents=total)` → `waitForTransactionReceipt` → receipt page.
- [ ] Double-click safe (disable while in flight), signature rejection → back to `ready`, wrong chain → `switchToArc`.
- [ ] Two-account end-to-end test on Arc (seller ≠ buyer). Re-seed and repeat until boringly reliable.

### Phase 3 — Seller + merchant consoles (gate: T+24h)
- [ ] `/sell`: balances, create listing (setApprovalForAll + createListing), cancel, proceeds.
- [ ] `/merchant`: issuer mints credit to an address; issued/redeemed totals; CheckoutCompleted list.

### Phase 4 — Ship
- [ ] CI green. Vercel deploy (`apps/web` root dir), env vars set. Public URL in README.
- [ ] Mobile viewport pass with B. Demo video 2–3 min. Devpost: Consumer Applications + Best Use of Arc (only if core is on Arc).

## Done when
Evaluator can clone → install → seed → buy on the deployed site, and the explorer shows seller paid 88 USDC
and 10,000 credit units burned in the same tx.

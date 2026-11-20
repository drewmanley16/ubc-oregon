# Status board

Update your lane's rows when something is **verified done** (link evidence: test output, tx hash, screenshot).
Times are Pacific. Deadline **Fri Nov 20, 10:00 a.m.** Feature freeze **Thu Nov 19 evening**.

## Checkpoints (spec §8)
| Gate | Target | A — UX | B — Design | C — Backend | D — Tech lead |
|---|---|---|---|---|---|
| T+2h | Wed Nov 18 eve | flows drafted | base tokens | types agreed ✅ (packages/shared) | Arc spike, wallets funded, first deploy |
| T+6h | Thu Nov 19 a.m. | state matrix | checkout + success designed | quote returns real listing | contract tests passing |
| T+12h | Thu Nov 19 midday | copy in copy.ts | components styled | orders + receipts | buyer flow on Arc → receipt |
| T+24h | Thu Nov 19 eve | first-user QA | responsive polish | tests green | seller + merchant consoles, FREEZE |
| Submit | Fri Nov 20 10:00 | demo script | screenshots | — | video, Devpost, deployed URL |

## Done (with evidence)
- [x] **Skeleton** — monorepo, frozen interfaces, shared types, lane docs. `pnpm check` green. (Nov 18)
- [x] Arc constants verified from docs.arc.io → `packages/shared/src/chain.ts`.
- [x] `GET /api/merchants`, `GET /api/merchants/:id/products` (seed data).
- [x] **(D) Arc spike** — live RPC: chainId 5042002, USDC `0x3600…` decimals 6 / symbol USDC; 4 fresh wallets generated (not anvil defaults).
- [x] **(D) Contracts** — MerchantCredit + SwayMarketplace implemented. `forge test`: **52 passed, 0 failed** (49 unit/fuzz + 3 invariants, 2048 calls each, 0 reverts).
- [x] **(D) Fee model** — per-merchant rates, locked per listing. Anvil rehearsal: buyer −88, seller +85, treasury +3 in one tx.
- [x] **(D) Deploy + SeedDemo scripts** — rehearsed on local anvil: checkout tx status 1, seller +88 USDC, escrow 0, totalRedeemed 10000, replay → `OrderAlreadySettled`.
- [x] **(D → C handoff) Critical-path API** — `POST /api/orders` (HMAC tokens, server prices only), `GET /api/listings`, `GET /api/quote`, `GET /api/orders/:id` (chain-verified receipts). 11 node tests (quote selection/tie-break, token tamper, client prices ignored). **Local E2E on anvil (chainId 5042002):** quote → listing 1 @ 88 USDC, saves $12.00 → UNPAID → `checkout` tx → PAID with seller 85 / fee 3 / buyer left 12; quote afterwards → `NO_LISTING`; tampered token → 401. Lane C owns these files going forward. (Nov 18)
- [x] **(D) Frontend wiring** — Privy + wagmi providers, `useSwayWallet`, `useCheckout` state machine, store→checkout→receipt pages. Build + lint green. *Untested in browser until C's orders/quote land and contracts are on Arc.*

- [x] **(D) Gift card swap model** (team decision Nov 19, Shantam's swap idea) — simulated store card system (`server/giftcards.ts`, Upstash/file KV), `POST /api/sell` (verify → swap → mint → gas top-up), `POST /api/cards/reveal` (chain receipt + buyer signature), `/sell`, gift card store page, receipt reveal, `/balance`. 15 node tests. **Local E2E (anvil, chainId 5042002):** demo card → wrong PIN rejected → sell: swapped, minted 10000 credit, seller gas 0 → 0.2 → old card $0 / `SWAPPED_OUT` → re-sell rejected `ZERO_BALANCE` → seller lists → quote 88 USDC → buyer checkout → reveal signed by seller rejected `NOT_BUYER` → reveal by buyer returns a NEW number with $100 → idempotent → USDC buyer 12 / seller 85 / treasury 3.

## Deployments
**Web (Vercel):** https://sway-ubc.vercel.app — project `sway-ubc`, root `apps/web`, auto-deploys from `main`. Env vars set (Privy, RPC, fresh signing/vault secrets, issuer key). **Missing:** Upstash (sell/reveal need it on Vercel).

| Contract | Address | Explorer |
|---|---|---|
| MerchantCredit | `0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64` | https://explorer.testnet.arc.io/address/0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64 |
| SwayMarketplace | `0xbA5b1c1621a815E1C254188374191C1AAFdb9f90` | https://explorer.testnet.arc.io/address/0xbA5b1c1621a815E1C254188374191C1AAFdb9f90 |
| USDC | `0x3600000000000000000000000000000000000000` (official, 6dp) | https://explorer.testnet.arc.io/address/0x3600000000000000000000000000000000000000 |
| Treasury (Sway fee) | `0x03CB170258eD7aBF3D77Fe0cc6293edc7BB44bAB` | https://explorer.testnet.arc.io/address/0x03CB170258eD7aBF3D77Fe0cc6293edc7BB44bAB |

Deployed Nov 19 at block 73100460. Verified on chain: `issuerOf(1)` = issuer, `merchantRates(1)` = 8800/8500, `previewPrice(1, 10000)` = 88 / 85 / 3 USDC, marketplace holds `REDEEMER_ROLE`, `usdc()` = official. Deploy cost ≈ 0.05 USDC.

## Contract changes log
| Date | Change | Lanes affected | PR |
|---|---|---|---|
| Nov 18 | Initial interfaces frozen | all | initial commit |
| Nov 18 | `SwayMarketplace` adds constructor error `ZeroAddress()` (ABI regenerated; no interface/event change) | C (none needed) | lane-d/contracts |
| Nov 19 | **Product pivot to gift cards (no contract change).** Seed products are now one `$100 gift card` per store. New: `SwayWallet.signMessage`, `/api/sell`, `/api/cards/reveal`, `/api/demo/cards`, `/api/giftcards/balance`, `lib/api.ts` `giftcards.*`, copy keys `store.*`, `sell.*`, `card.*`, `balance.*`. Cart flow removed. | A (copy), B (sell/reveal/card visuals), C (owns new server files) | lane-d/giftcard-swap |
| Nov 18 | `MarketplaceListing.txHash` is now `Hex \| null` (Arc limits log queries to ~2,000 blocks, so the creation tx is only looked up in a ~3 h window). `GET /api/quote` takes optional `orderId`; `GET /api/orders/:id` takes optional `tx` hint (re-verified on chain). | C, D | lane-d/critical-path-api |
| Nov 18 | **Fee model.** Sway-set per-merchant rates (demo 88% buyer / 85% seller / 3% fee). `createListing(merchantId, creditCents)` (no ask arg). `Listing` + `ListingCreated` add `sellerPayoutUnits`; `CheckoutCompleted` adds `sellerPayoutUnits`, `feeUnits`. New: `setMerchantRates`, `setTreasury`, `previewPrice`, `merchantRates`, `treasury`. Types: `MarketplaceListing.sellerPayoutUnits`, `CheckoutReceipt.sellerPayoutUnits/feeUnits`, `Deployment.treasury`. Copy: `receipt.swayFee`. | **C** (listings + receipts), A (fee copy), B (receipt) | lane-d/contracts |

## Blockers / cross-lane requests
- (lane D) Need Privy App ID → `NEXT_PUBLIC_PRIVY_APP_ID`.
- (lane D) Waiting on Arc faucet funding: **deployer ~2 USDC, issuer ~5 USDC** (it mints for every sale and tops up each new seller with 0.2 USDC gas). Buyer = a Privy account with ~90 USDC at demo time.
- (lane D) Need Upstash Redis REST URL + token for Vercel (local dev uses a file).
- ~~(lane D → C) Buyer flow E2E needs orders/quote/receipt endpoints~~ — done by D on `lane-d/critical-path-api`. Lane C: review it, then take the remaining items in your lane file.

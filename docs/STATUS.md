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
- [x] **(D) Contracts** — MerchantCredit + SwayMarketplace implemented. `forge test`: **42 passed, 0 failed** (39 unit/fuzz + 3 invariants, 2048 calls each, 0 reverts).
- [x] **(D) Deploy + SeedDemo scripts** — rehearsed on local anvil: checkout tx status 1, seller +88 USDC, escrow 0, totalRedeemed 10000, replay → `OrderAlreadySettled`.
- [x] **(D) Frontend wiring** — Privy + wagmi providers, `useSwayWallet`, `useCheckout` state machine, store→checkout→receipt pages. Build + lint green. *Untested in browser until C's orders/quote land and contracts are on Arc.*

## Deployments
| Contract | Address | Explorer |
|---|---|---|
| MerchantCredit | — | — |
| SwayMarketplace | — | — |
| USDC | `0x3600000000000000000000000000000000000000` (official, 6dp) — pending end-to-end spike | https://explorer.testnet.arc.io/address/0x3600000000000000000000000000000000000000 |

## Contract changes log
| Date | Change | Lanes affected | PR |
|---|---|---|---|
| Nov 18 | Initial interfaces frozen | all | initial commit |
| Nov 18 | `SwayMarketplace` adds constructor error `ZeroAddress()` (ABI regenerated; no interface/event change) | C (none needed) | lane-d/contracts |

## Blockers / cross-lane requests
- (lane D) Need Privy App ID → `NEXT_PUBLIC_PRIVY_APP_ID`.
- (lane D) Waiting on Arc faucet funding for deployer/issuer/seller/buyer before Arc deploy.
- (lane D → C) Buyer flow E2E needs `POST /api/orders`, `GET /api/orders/:id`, `GET /api/quote`. Frontend calls them via `lib/api.ts` exactly as typed.

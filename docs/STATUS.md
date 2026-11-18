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

## Blockers / cross-lane requests
- (lane D) Need Privy App ID → `NEXT_PUBLIC_PRIVY_APP_ID`.
- (lane A → lane D) Four UX questions from `docs/ux/journeys.md`: Q1 approve a larger USDC cap once so "Enable payment" is truly one time (per-order approval breaks the 5-tap returning path); Q2 can Privy skip its extra confirm popup for embedded accounts; Q3 how a brand-new buyer gets USDC without visiting a faucet; Q4 lock the demo cart at $100 so it always matches the listing.

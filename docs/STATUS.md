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
  - Q1 update (Nov 19, lane A): `use-checkout.ts` approves exactly the ask inside the Pay tap, so it's per order. Copy now says so honestly (`copy.checkout.twoConfirmations`, `copy.tx.needsApproval`). If you switch to a one-time larger cap, tell lane A and the copy goes back to "one time".

### Copy wiring (lane A → lanes D and B)
`apps/web/content/copy.ts` is rewritten (Nov 19). Every key lane D already uses is unchanged, and `pnpm --filter @sway/web typecheck` passes on `lane-d/critical-path-api` with the new file. These strings are still typed into code; swap them for the keys below:
- `components/sway/TxProgress.tsx` (B, D): shows the raw phase name. Map each `CheckoutPhase` to `copy.tx.*` (`loadingQuote`, `signedOut`, `needsApproval`, `ready`, `approving`, `awaitingSignature`, `pending`, `confirmed`, `rejected`, `failed`, `wrongNetwork`), `quote-stale` → `copy.checkout.quoteStale`, `no-offer` → `copy.checkout.noOffer`, `insufficient-funds` → `copy.tx.insufficientFundsDetail(need, have)`. Use `copy.tx.failedTaken` when the revert is `ListingNotActive`.
- `app/checkout/[orderId]/checkout-client.tsx` (D): `"Pay"` → `copy.checkout.cta.payFallback`; `"Try again"` → `copy.checkout.cta.retry` (and `copy.checkout.cta.findAnother` for `failed`); signed-out with a known price → `copy.checkout.cta.signInToPay(amount)`; missing token / load error → `copy.errors.missingOrderToken` / `copy.errors.orderLoad`.
- `components/sway/QuoteCard.tsx` (B): replace `Listing #N · held Ns` with `copy.checkout.quoteExpires(secondsLeft)` (no listing number in the main UI); `You save` → `copy.checkout.savingsLine(amount)`; add `copy.checkout.feeIncluded(fee)` under price details.
- `components/sway/ReceiptCard.tsx` (B): `You saved` → `copy.receipt.title`; `Retail` / `Paid` → `copy.receipt.retailValue` / `copy.receipt.paid`; `View transaction` → `copy.receipt.viewOnExplorer`; add a `copy.receipt.swayFee` row.
- `app/receipt/[orderId]/receipt-client.tsx` (D): waiting state → `copy.tx.confirmingReceipt`; `Missing order token.` → `copy.errors.missingReceiptToken`.
- `app/store/[slug]/cart.tsx` (D): `Checkout` → `copy.store.checkout(total)`; `Starting checkout…` → `copy.store.startingCheckout`; raw error text → `copy.store.error`.
- `components/sway/AccountChip.tsx` (B, D): `Sign in` / `Sign out` → `copy.account.signIn` / `copy.account.signOut`.

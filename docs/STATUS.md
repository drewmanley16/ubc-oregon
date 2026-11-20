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
- (lane A → lane D) UX questions from `docs/ux/journeys.md` (updated Nov 19 after lane A reviewed lane D's branches):
  - Q1 answered: approval is per order (`use-checkout.ts`). It costs no taps because Privy signs without pop-ups, so it stays.
  - Q2 answered: `showWalletUIs: false` already removes the confirm pop-up.
  - Q3 **open**: how does a brand-new shopper get money in their account? A fresh sign-in has $0, so a judge trying it cold hits `insufficient-funds`. Options: pre-funded demo account, or a demo top-up button. A faucet link breaks "crypto is invisible".
  - Q4 answered: seed carts total exactly $100 and `cart.tsx` uses quantity 1.
- (lane A → lanes B and D) **Hold to pay** (approved UX, see `docs/ux/prototype.html`): the pay button becomes "Hold to pay $88". Holding about 0.9 s fills it green, then calls the existing `pay()`; releasing early cancels and shows `copy.checkout.hold.releasedEarly`. Keyboard: hold Enter or Space. Backup link `copy.checkout.hold.altConfirm` opens a confirm sheet (`copy.checkout.confirmSheet`) whose Pay button calls `pay()` and Cancel sets `rejected`. B builds the button and fill, D wires it.
- (lane A → lane D) **Drop `"wallet"` from Privy `loginMethods`** in `app/providers.tsx`. It adds a crypto-wallet option to the sign-in sheet. Email, Google and passkey are enough.
- (lane A → lane D) **Receipt**: rename the explorer link to `copy.receipt.viewOnExplorer` ("View payment record") and add the footer line `copy.footer.ledger` ("Payments are recorded on Arc, a public ledger.") to the landing page and receipt.

### Copy wiring (lane A → lanes D and B)
`apps/web/content/copy.ts` matches the approved prototype (Nov 19). Every key lane D already uses is unchanged, and `pnpm --filter @sway/web typecheck` passes on `lane-d/critical-path-api` with the new file. These strings are still typed into code; swap them for the keys below:
- `components/sway/TxProgress.tsx` (B, D): shows the raw phase name. Map each `CheckoutPhase` to `copy.tx.*` (`loadingQuote`, `signedOut`, `needsApproval`, `ready`, `approving`, `awaitingSignature`, `pending`, `confirmed`, `rejected`, `failed`, `wrongNetwork`), `quote-stale` → `copy.checkout.quoteStale`, `no-offer` → `copy.checkout.noOffer`, `insufficient-funds` → `copy.tx.insufficientFundsDetail(need, have)`. Use `copy.tx.failedTaken` when the revert is `ListingNotActive`.
- `app/checkout/[orderId]/checkout-client.tsx` (D): `needs-approval` / `ready` button → `copy.checkout.cta.holdToPay(amount)` (see Hold to pay above); `"Pay"` → `copy.checkout.cta.payFallback`; `"Try again"` → `copy.checkout.cta.retry` (and `copy.checkout.cta.findAnother` for `failed`); signed-out with a known price → `copy.checkout.cta.signInToPay(amount)`; missing token / load error → `copy.errors.missingOrderToken` / `copy.errors.orderLoad`.
- `components/sway/QuoteCard.tsx` (B): replace `Listing #N · held Ns` with `copy.checkout.quoteExpires(secondsLeft)` (no listing number in the main UI); `You save` → `copy.checkout.savingsLine(amount)`; inside price details add `copy.checkout.feeIncluded(fee)`.
- `components/sway/ReceiptCard.tsx` (B): `You saved` → `copy.receipt.title`; `Retail` / `Paid` → `copy.receipt.retailValue` / `copy.receipt.paid`; `View transaction` → `copy.receipt.viewOnExplorer`; add a fee row `copy.receipt.swayFee` with `copy.receipt.swayFeeIncluded(fee)`.
- `app/receipt/[orderId]/receipt-client.tsx` (D): waiting state → `copy.tx.confirmingReceipt`; `Missing order token.` → `copy.errors.missingReceiptToken`.
- `app/store/[slug]/cart.tsx` (D): `Checkout` → `copy.store.checkout(total)`; `Starting checkout…` → `copy.store.startingCheckout`; raw error text → `copy.store.error`.
- `components/sway/AccountChip.tsx` (B, D): `Sign in` / `Sign out` → `copy.account.signIn` / `copy.account.signOut`.
- Seller page `/sell` (D, phase 3): all strings are in `copy.sell.*`; layout is in `docs/ux/prototype.html` (switch to Seller).

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

- [x] **(B) Payment confirmation animation (Nov 20, lane-b/confirm-spin)** — `components/sway/ConfirmSpin.tsx`: once the order is **PAID on chain**, the gift card spins in and settles, then "Transaction accepted" + link to the tx on Arcscan (`testnet.arcscan.app/tx/<hash>`, same Blockscout data as explorer.testnet.arc.io). Plays once per order per tab; Esc / button dismisses; reduced motion shows the end state. QA with a stubbed PAID response (real tx hash) at 375/1440 + reduced motion: link correct, focus on button, closes, no replay on reload, 0 page errors. Screenshots `docs/screenshots/lane-b/confirm-*`. **Cross-lane:** 3 copy keys added to `copy.receipt` (A: reword freely), 1-line mount in `receipt-client.tsx` inside the PAID branch (D).

## Deployments
**Web (Vercel):** https://sway-ubc.vercel.app — project `sway-ubc`, root `apps/web`, auto-deploys from `main`. Env vars set (Privy, RPC, fresh signing/vault secrets, issuer key). **Missing:** Upstash (sell/reveal need it on Vercel).

| Contract | Address | Explorer |
|---|---|---|
| MerchantCredit | `0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64` | https://explorer.testnet.arc.io/address/0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64 |
| SwayMarketplace | `0xbA5b1c1621a815E1C254188374191C1AAFdb9f90` | https://explorer.testnet.arc.io/address/0xbA5b1c1621a815E1C254188374191C1AAFdb9f90 |
| USDC | `0x3600000000000000000000000000000000000000` (official, 6dp) | https://explorer.testnet.arc.io/address/0x3600000000000000000000000000000000000000 |
| Treasury (Sway fee) | `0x03CB170258eD7aBF3D77Fe0cc6293edc7BB44bAB` | https://explorer.testnet.arc.io/address/0x03CB170258eD7aBF3D77Fe0cc6293edc7BB44bAB |

Deployed Nov 19 at block 73100460. Verified on chain: `issuerOf(1)` = issuer, `merchantRates(1)` = 8800/8500, `previewPrice(1, 10000)` = 88 / 85 / 3 USDC, marketplace holds `REDEEMER_ROLE`, `usdc()` = official. Deploy cost ≈ 0.05 USDC.

**First real sell on Arc (Nov 19):** demo card swapped (old number → $0, `SWAPPED_OUT`) → mint 10000 credit to seller
[`0x5018…9882`](https://explorer.testnet.arc.io/tx/0x501835674dd488f0e92c39274b90b819aa1126db88eec7c97e27d91733d59882) →
seller gas top-up 0 → 0.2 USDC [`0xad39…e7fe`](https://explorer.testnet.arc.io/tx/0xad3909154d2c956bdaaad24562507130e739f3e3e6741bbcbba68f7c8a65e7fe) →
approve [`0xa0fc…3dbe`](https://explorer.testnet.arc.io/tx/0xa0fcf5d9143a41edcc4698814eb5a882c3fd1b5686da2b859750e16062a13dbe) →
listing #1 [`0x04c5…355e`](https://explorer.testnet.arc.io/tx/0x04c59cf0a95894505db1a5cb4fdc95d5bc9573060efffafc22d07a1ad4e0355e) (88 / 85 USDC).
Live site `GET /api/quote?merchantId=1&amountCents=10000` returns listing 1, saves $12.00. Buy pending a funded buyer.
⚠️ Listing #1's vault card is in Drew's **local** KV (no Upstash yet) → reveal it via `localhost:3000`, not the live site.

**Nov 20 — per-store rates (on chain, admin):** buyer pays 83–94% of face (saves 6–17%), seller gets buyer − 3%, Sway keeps 3%.
1:88 2:90 3:85 4:92 5:87 6:91 7:84 8:89 9:93 10:86 11:83 12:94 (buyer %). Stores 4–12 registered Nov 20. Demo cards are $1.

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
- ~~(lane D) Arc faucet funding~~ — done, deployed Nov 19 (see Deployments).
- (lane D) Upstash for Vercel: deferred by Drew. Live site can't sell/reveal until it's added; local dev uses a file.
- ~~(lane D → C) Buyer flow E2E needs orders/quote/receipt endpoints~~ — done by D on `lane-d/critical-path-api`. Lane C: review it, then take the remaining items in your lane file.
- (lane D → lane A) Merged `lane-a/flows` Nov 19. Your copy.ts was kept as the base; for the gift card pivot D rewrote `landing`, `store` (new keys `giftCard`, `withSway`, `youSave`, `noOffer`, `buy`, `starting`, `checking`), `sell`, and added `card`, `balance` in your voice. Please review + reword. **Reviewed by lane A Nov 19:** reworded in the gift card voice; see the copy.ts header.
- (lane A → lane D) UX questions from `docs/ux/journeys.md` (updated Nov 19 after lane A reviewed lane D's branches):
  - Q1 answered: approval is per order (`use-checkout.ts`). It costs no taps because Privy signs without pop-ups, so it stays.
  - Q2 answered: `showWalletUIs: false` already removes the confirm pop-up.
  - Q3 **open**: how does a brand-new shopper get money in their account? A fresh sign-in has $0, so a judge trying it cold hits `insufficient-funds`. Options: pre-funded demo account, or a demo top-up button. A faucet link breaks "crypto is invisible".
  - Q4 answered: after the gift card pivot each shop sells one $100 card, so totals always match.
- (lane A → lanes B and D) **Hold to pay** (approved UX, see `docs/ux/prototype.html`): the pay button becomes "Hold to pay $88". Holding about 0.9 s fills it green, then calls the existing `pay()`; releasing early cancels and shows `copy.checkout.hold.releasedEarly`. Keyboard: hold Enter or Space. Backup link `copy.checkout.hold.altConfirm` opens a confirm sheet (`copy.checkout.confirmSheet`) whose Pay button calls `pay()` and Cancel sets `rejected`. B builds the button and fill, D wires it.
- (lane A → lane D) **Drop `"wallet"` from Privy `loginMethods`** in `app/providers.tsx`. It adds a crypto-wallet option to the sign-in sheet. Email, Google and passkey are enough.
- (lane A → lane D) **Receipt**: rename the explorer link to `copy.receipt.viewOnExplorer` ("View payment record") and add the footer line `copy.footer.ledger` ("Payments are recorded on Arc, a public ledger.") to the landing page and receipt.
- (lane A → lane D) **Live site QA, Nov 19** (https://sway-ubc.vercel.app, shopper path up to sign-in):
  - Checkout shows the raw phase word under the price ("signed-out"). Fix: `TxProgress.tsx` should render `copy.tx.*` (see Copy wiring).
  - Quote box says "Listing #1 · held 57s". Fix: `QuoteCard.tsx` → `copy.checkout.quoteExpires(secondsLeft)`, no listing number.
  - Button says "Sign in to pay" with no amount. Fix: `checkout-client.tsx` → `copy.checkout.cta.signInToPay(formatCents(payCents))` when the price is known.
  - Order line reads "× 1 — $100.00" (`OrderSummary.tsx`): drop the dash and quantity for a single gift card, e.g. "Daybreak Coffee $100 gift card".
  - The Daybreak card on the home page didn't respond to one click in testing; typing the URL worked. Needs a manual recheck.
  - Sell and reveal can't work on the live site until Upstash is added (already noted above).

### Copy wiring (lane A → lanes D and B)
`apps/web/content/copy.ts` matches the approved prototype (Nov 19). Every key lane D already uses is unchanged, and `pnpm --filter @sway/web typecheck` passes on `lane-d/critical-path-api` with the new file. These strings are still typed into code; swap them for the keys below:
- `components/sway/TxProgress.tsx` (B, D): shows the raw phase name. Map each `CheckoutPhase` to `copy.tx.*` (`loadingQuote`, `signedOut`, `needsApproval`, `ready`, `approving`, `awaitingSignature`, `pending`, `confirmed`, `rejected`, `failed`, `wrongNetwork`), `quote-stale` → `copy.checkout.quoteStale`, `no-offer` → `copy.checkout.noOffer`, `insufficient-funds` → `copy.tx.insufficientFundsDetail(need, have)`. Use `copy.tx.failedTaken` when the revert is `ListingNotActive`.
- `app/checkout/[orderId]/checkout-client.tsx` (D): `needs-approval` / `ready` button → `copy.checkout.cta.holdToPay(amount)` (see Hold to pay above); `"Pay"` → `copy.checkout.cta.payFallback`; `"Try again"` → `copy.checkout.cta.retry` (and `copy.checkout.cta.findAnother` for `failed`); signed-out with a known price → `copy.checkout.cta.signInToPay(amount)`; missing token / load error → `copy.errors.missingOrderToken` / `copy.errors.orderLoad`.
- `components/sway/QuoteCard.tsx` (B): replace `Listing #N · held Ns` with `copy.checkout.quoteExpires(secondsLeft)` (no listing number in the main UI); `You save` → `copy.checkout.savingsLine(amount)`; inside price details add `copy.checkout.feeIncluded(fee)`.
- `components/sway/ReceiptCard.tsx` (B): `You saved` → `copy.receipt.title`; `Retail` / `Paid` → `copy.receipt.retailValue` / `copy.receipt.paid`; `View transaction` → `copy.receipt.viewOnExplorer`; add a fee row `copy.receipt.swayFee` with `copy.receipt.swayFeeIncluded(fee)`.
- `app/receipt/[orderId]/receipt-client.tsx` (D): waiting state → `copy.tx.confirmingReceipt`; `Missing order token.` → `copy.errors.missingReceiptToken`.
- ~~`app/store/[slug]/cart.tsx`~~ — removed in the gift card pivot; the store page is now `app/store/[slug]/offer.tsx` and already uses `copy.store.*`.
- `components/sway/AccountChip.tsx` (B, D): `Sign in` / `Sign out` → `copy.account.signIn` / `copy.account.signOut`.
- Seller page `/sell` (D): built in the gift card pivot and already uses `copy.sell.*`. Optional extras for its next pass: `copy.sell.noDrainTitle/noDrainBody`, `whyTitle/whyBody`, `split`, `soldTitle/soldSub` (layout ideas in `docs/ux/prototype.html`, Seller).

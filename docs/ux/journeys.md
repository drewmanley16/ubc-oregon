# User journeys

Lane A (UX). Three roles: **buyer** (primary, this is the demo), **seller**, **merchant**.
Every step lists the screen, what the person does, what they see, and what happens on-chain.

Ground rules that apply to every journey:
- Lead with money saved. Prices show as dollars ("$88"), never "88 USDC" in primary UI.
- Users "Sign in". Never "connect wallet", "gas", "ERC-1155", "bridge" or "wallet address" in primary UI.
- "Paid" only appears after a confirmed transaction receipt. No optimistic success screens.
- All merchants and credit are fictional. "Demo credit" label wherever credit balances appear.

Checkout phase names in `code` match `CheckoutPhase` in `apps/web/lib/tx/types.ts`.
The full per-screen state list lives in `state-matrix.md`.

---

## 1. Buyer, first time (primary demo path)

**Who:** Maya. Has a $100 cart at Daybreak Coffee. Has never used Sway. Doesn't know or care what a blockchain is.
**Goal:** pay less for the same order.
**Before this starts:** a seller has already listed $100 of Daybreak credit for $88 (see journey 3), and Maya's account holds enough USDC (see open question Q3).

| # | Screen | Maya does | Maya sees | On-chain |
|---|---|---|---|---|
| 1 | Landing `/` | Taps **Daybreak Coffee** | "Your $100 order. $88 with Sway." Three fictional shops. Demo banner. | Nothing |
| 2 | Store `/store/daybreak-coffee` | Taps **Check out** | Her $100 cart, item by item | Nothing. The server creates a signed order (`POST /api/orders`). No database, no chain. |
| 3 | Checkout `/checkout/[orderId]` | Waits a moment | Order total $100, then "Finding you a better price" (`loading-quote`) | Read only. Server finds the best active listing (`GET /api/quote`); the app re-reads that listing on-chain to confirm it is still for sale. |
| 4 | Checkout | Reads the offer, taps **Sign in to pay $88** | Order $100. Sway savings -$12. **You pay $88.** Small line: "Offer held for 60s" (`signed-out`) | Nothing |
| 5 | Sign-in sheet (Privy) | Signs in with email code or Google | Familiar sign-in sheet. No seed phrase, no extension. | Nothing on-chain. Privy creates an account for her behind the scenes. |
| 6 | Checkout | Taps **Enable payment** | One-time setup: "Let Sway charge your balance for checkouts. You only do this once." (`needs-approval`, then `approving`) | **Transaction 1:** `usdc.approve(marketplace, amount)`. Gives the Sway contract permission to take USDC from her account. No money moves yet. |
| 7 | Checkout | Taps **Pay $88** | Button becomes "Confirm in the sign-in window" (`awaiting-signature`), then "Paying..." (`pending`). Button locked so she can't double-tap. | **Transaction 2:** `marketplace.checkout(...)`. In one transaction: $88 USDC goes from Maya to the seller, the seller's $100 Daybreak credit is burned, the order is marked paid, and `CheckoutCompleted` is emitted as the shop's receipt. If any part fails, none of it happens. |
| 8 | Receipt `/receipt/[orderId]` | Reads it, maybe taps **View proof** | **You saved $12.** Order $100, you paid $88. "Paid with $100 of Daybreak store credit." Link: "View on Arc explorer" (`confirmed`) | Read only. Receipt is built from the `CheckoutCompleted` event (`GET /api/orders/:id`). Reloading the page gives the same receipt. |

**Tap count, first time:** Daybreak (1), Check out (2), Sign in (3), sign-in method plus code (about 2 more), Enable payment (6), Pay (7), plus any confirm popup from Privy. About **7 to 9 taps**. That's acceptable for a first visit; sign-in and payment setup are one-time costs.

### Detours (what can interrupt the path)

| When | Phase | What Maya sees (direction, final copy goes in `copy.ts`) | What happens |
|---|---|---|---|
| Step 3, no listing matches | `no-offer` | "No discount available for this order right now." Option to go back to the store. | Nothing. We never invent a quote. |
| Step 4 to 7, offer older than its time limit | `quote-stale` | "Prices may have changed. Refresh your price." One tap re-quotes. | Re-reads listings. |
| Step 5 onward, not enough balance | `insufficient-funds` | "You need $88 in your balance. You have $X." Plus how to add funds (see Q3). | Nothing. Checked before she can tap Pay. |
| Step 6 onward, account on the wrong network | `wrong-network` | "Switch to continue" with one button. Should be rare with a Privy account. | App asks to switch to Arc testnet. |
| Step 7, Maya closes the confirm popup | `rejected` | Back to the **Pay $88** button. Calm tone, no error color. "No payment was made." | Nothing was sent. |
| Step 7, transaction fails (seller cancelled, someone else bought it, price changed) | `failed` | "This offer was just taken. You were not charged." Button: **Find another price**. | The whole transaction reverted, so no money moved and no credit burned. (Her payment permission from step 6 stays in place.) |

---

## 2. Buyer, returning (the 5-tap target)

**Who:** Maya again, a week later. Still signed in. Payment already enabled (but see Q1).

| # | Screen | Maya does | Taps |
|---|---|---|---|
| 1 | Landing | Taps **Daybreak Coffee** | 1 |
| 2 | Store | Taps **Check out** | 2 |
| 3 | Checkout | Sees "You pay $88", taps **Pay $88** | 3 |
| 4 | Privy confirm (if shown) | Taps **Confirm** | 4 |
| 5 | Receipt | Lands here automatically after confirmation | none |

**Result: 3 to 4 taps, under the target of 5.** This only holds if two things are true, both owned by Lane D:
- Payment permission from the first visit still covers this order (Q1).
- She stays signed in between visits (Privy session).

---

## 3. Seller

**Who:** Jordan. Was given $100 of Daybreak Coffee credit (demo credit) and would rather have $88 cash now than $100 of coffee later.
**Goal:** turn store credit into money, without haggling or waiting on a buyer to show up.
**Before this starts:** Daybreak has issued Jordan $100 of credit (see journey 4).

| # | Screen | Jordan does | Jordan sees | On-chain |
|---|---|---|---|---|
| 1 | Sell `/sell` | Taps **Sign in** | "Turn store credit into cash." | Nothing |
| 2 | Sell, signed in | Looks at balances | "Daybreak Coffee: $100 of store credit" with a "demo credit" tag | Read only: his credit balance per shop. |
| 3 | Sell, create listing | Keeps $100, sets price to **$88**, taps **List for $88** | Live preview: "You get $88 when it sells. Shoppers save $12." | Nothing yet |
| 4 | Sell | Taps **Allow Sway to hold your credit** (first time only) | "Your credit stays locked with Sway until it sells or you cancel." | **Transaction 1:** `credit.setApprovalForAll(marketplace, true)`. Lets the Sway contract move his credit. |
| 5 | Sell | Confirms the listing | "Listed. Your $100 credit is locked until it sells or you cancel." | **Transaction 2:** `marketplace.createListing(merchantId, 10000, 88000000)`. His $100 of credit moves into escrow (held by the contract). `ListingCreated` emitted. |
| 6 | Sell, active listing | Waits. Can tap **Cancel listing**. | Listing card: Daybreak, $100 credit, asking $88, status Active | If he cancels: `cancelListing(...)` returns exactly $100 of credit to him. `ListingCancelled` emitted. |
| 7 | Sell, sold | Checks back | Listing status **Sold**. "+$88 received." Proceeds total. | Read only: `CheckoutCompleted` events where he is the seller, plus his balance. The $88 arrived in the same transaction as Maya's checkout. |

**Tap count:** about 6 taps plus sign-in, once. Fine for a secondary flow.

Why the credit can't be "drained" (good for copy and judge Q&A): it is never a code. While listed, it sits in the contract. At checkout it is burned in the same transaction that pays Jordan, so nobody can spend it twice.

---

## 4. Merchant (minimal console)

**Who:** Daybreak Coffee's owner. Issues store credit and needs to know when an order was paid with it.
**Goal:** issue credit to a customer, then see redemptions as receipts.
**Before this starts:** Sway's admin registered Daybreak and its issuer account when the contracts were deployed (`registerMerchant`, no UI).

| # | Screen | Merchant does | Merchant sees | On-chain |
|---|---|---|---|---|
| 1 | Merchant `/merchant` | Signs in with the Daybreak issuer account | Daybreak Coffee console | Nothing |
| 2 | Merchant, overview | Reads totals | Issued, Redeemed, Outstanding (in dollars) | Read only: `totalIssued`, `totalRedeemed`, `outstanding`. |
| 3 | Merchant, issue credit | Picks the recipient (Jordan, the demo seller), enters **$100**, taps **Issue $100 credit** | Confirmation: "$100 of demo credit issued to Jordan." | **Transaction:** `credit.mintCredit(merchantId, to, 10000, memo)`. Only Daybreak's issuer can do this. `CreditIssued` emitted. |
| 4 | Merchant, sales | Reads the list after Maya's checkout | Row: order, $100 credit redeemed, "Paid", explorer link. This is the merchant's signal to hand over the goods. | Read only: `CheckoutCompleted` events for Daybreak. |

If someone signs in who isn't Daybreak's issuer: "This account can't issue credit for Daybreak Coffee." (contract error `NotIssuer`).

This console is an operator screen, so showing a recipient's address in a secondary spot is acceptable here. Prefer a "Demo seller" pick list over typing an address.

---

## How the journeys connect (demo order)

1. **Merchant** issues $100 of Daybreak credit to Jordan. (`mintCredit`)
2. **Seller** lists it for $88. (`setApprovalForAll`, `createListing`)
3. **Buyer** checks out a $100 cart and pays $88. (`approve`, `checkout`)
4. Jordan's sell page shows +$88. Daybreak's console shows $100 redeemed.

For the video, steps 1 and 2 can be pre-done by Lane D's seed script (`SeedDemo.s.sol`) so the recording focuses on the buyer. Showing the seller's "+$88" afterwards closes the story.

---

## Open questions for Lane D (Drew)

Also logged in `docs/STATUS.md` under "Blockers / cross-lane requests".

- **Q1. Is "Enable payment" really one time?** The spec approves exactly the quote amount ($88). That means every new order needs a fresh approval, so the returning buyer would see "Enable payment" again and the 5-tap path breaks. Option: approve a larger cap once (for example $500) on testnet. If it stays per-order, the copy must say "for this payment", not "one time".
- **Q2. Can Privy skip its extra confirm popup** for in-app payments with the embedded account? Each popup adds a tap to both buyer journeys.
- **Q3. How does a brand-new buyer get USDC?** A fresh sign-in has $0, so a judge trying it cold hits `insufficient-funds`. Options: demo uses a pre-funded buyer account, or the app tops up new accounts from a demo faucet. Sending people to faucet.circle.com breaks "crypto is invisible".
- **Q4. Can the buyer change cart quantities?** The seed carts already total exactly $100 ($72 beans subscription + $28 pour-over set for Daybreak), which the MVP needs because the listing must cover the order exactly (`expectedCreditCents`). If quantities are editable, any other total lands on `no-offer`. Suggest locking the cart at $100 for the demo.

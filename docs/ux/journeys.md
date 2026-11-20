# User journeys

Lane A (UX). Three roles: **shopper** (primary, this is the demo), **seller**, **merchant**.
Every step lists the screen, what the person does, what they see, and what happens on-chain.

Approved Nov 19 and matched to lane D's system (`lane-d/critical-path-api`). Clickable version:
[prototype.html](prototype.html), which switches between shopper and seller.

Ground rules that apply to every journey:
- Lead with money saved. Prices show as dollars ("$88"), never "88 USDC" in primary UI.
- One honest total. The $3 Sway fee is inside the $88, shown in Price details and on the receipt.
- Users "Sign in". Never "connect wallet", "gas", "ERC-1155", "bridge" or "wallet address" in primary UI.
  Arc is named once, in a footer: "Payments are recorded on Arc, a public ledger."
- "Paid" only appears after a confirmed transaction receipt. No optimistic success screens.
- All shops and credit are fictional. "Demo credit" label wherever credit appears.

How the money splits (lane D fee model): Sway sets rates per shop. For the demo, shoppers pay **88%**
of face value, sellers get **85%**, Sway keeps **3%**. On a $100 order: shopper pays $88, seller gets $85,
Sway keeps $3. Rates lock into each listing when it's posted. Sellers don't choose a price.

Checkout phase names in `code` match `CheckoutPhase` in `apps/web/lib/tx/types.ts`.

---

## 1. Shopper, first visit (primary demo path)

**Who:** Maya. Has a $100 cart at Daybreak Coffee. Has never used Sway.
**Goal:** pay less for the same order.
**Before this starts:** a seller has listed $100 of Daybreak credit (journey 3), and Maya's account has money in it (see Q3).

| # | Screen | Maya does | Maya sees | On-chain |
|---|---|---|---|---|
| 1 | Sway home `/` | Taps **Daybreak Coffee** | "Your $100 order. $88 with Sway." All three shops show "Save $12 on your $100 order". | Nothing |
| 2 | Shop `/store/daybreak-coffee` | Taps **Check out · $100.00** | Her $100 cart, "Sway will lower your price at checkout" | Nothing. The server writes a signed order slip (`POST /api/orders`). |
| 3 | Checkout `/checkout/[orderId]` | Waits a moment | "Finding you a better price" (`loading-quote`) | Read only. Server picks the oldest listing that covers $100 exactly (`GET /api/quote`); the app re-checks it on the ledger. |
| 4 | Checkout | Taps **Sign in to pay $88** | $100 crossed out, big **$88**, "You save $12 with Sway", "Price held for 1:00". Price details (closed) lists items, store credit discount, "Includes $3 Sway service fee". (`signed-out`) | Nothing. Browsing and seeing the price need no account. |
| 5 | Sign-in sheet (Privy) | Continues with Google or email | "No password, no app to download." | Nothing on-chain. Privy creates her secure account behind the scenes. |
| 6 | Checkout | **Holds "Hold to pay $88"** for about a second | The button fills green, then "Allowing this payment…", then "Paying…". No pop-ups. (`needs-approval` or `ready`, then `approving`, then `pending`) | Two transactions from one hold, signed quietly by Privy: **1.** `usdc.approve(marketplace, $88)`, permission only. **2.** `marketplace.checkout(...)`: in one step Maya pays $88, the seller gets $85, Sway gets $3, the $100 credit is burned, the order is marked paid, `CheckoutCompleted` is emitted. If any part fails, none of it happens. |
| 7 | Receipt `/receipt/[orderId]` | Reads it, maybe taps **View payment record** | "Confirming your payment…", then **You saved $12**. "Paid $88 for your $100 Daybreak Coffee order." Rows: you paid, covered by $100 of Daybreak store credit, Sway service fee $3.00 (included), credit seller paid at the same moment. (`confirmed`) | Read only. Receipt is rebuilt from the `CheckoutCompleted` event (`GET /api/orders/:id`). The payment record sheet shows the same facts in plain words, with "Open the raw record on Arc" at the bottom. |

**Taps, first visit:** Daybreak (1), Check out (2), Sign in to pay (3), Continue with Google (4), Hold to pay (5). About **5**, plus any account picker Google shows.

### Why hold to pay
Paying can't be undone, and there are no pop-ups to catch a mistake. A one-second hold prevents accidental
payments without adding a screen. Letting go early shows "Hold the button for a second to pay" and charges nothing.
Backup for people who can't hold (keyboard, screen readers): "Can't hold? Tap to confirm instead" opens a confirm
sheet ("Confirm payment, $88.00, This can't be undone", Pay $88 / Cancel).

### Detours

| When | Phase | What Maya sees | What happens |
|---|---|---|---|
| Step 3, no listing matches | `no-offer` | "No deal for this order right now. Check back soon, or pay full price at the shop." Check again / Back to store. | Nothing. Sway never invents a price. |
| Steps 4 to 6, price older than 60 s | `quote-stale` | Price dims. "This price expired. Store credit prices can change, so refresh to get the latest." Refresh price. | Re-reads listings. |
| Step 6, not enough balance | `insufficient-funds` | "Not enough in your balance. You need $88.00. Your balance is $40.00." | Nothing. Checked before paying is allowed. |
| Step 6, wrong network | `wrong-network` | "Switch to continue. Your account is pointed somewhere else. One tap fixes it." | App asks to switch to Arc. Rare with a Privy account. |
| Backup sheet, Maya taps Cancel | `rejected` | Back to the hold button. "Payment cancelled. You weren't charged." Calm tone, no error color. | Nothing was sent. |
| Step 6, the swap is refused | `failed` | "This deal was just taken. Someone else bought this store credit a moment ago. You weren't charged." Find another price. | The whole swap reverted: no money moved, no credit burned. Her $88 permission from transaction 1 stays in place. |

---

## 2. Shopper, returning (the 5-tap target)

**Who:** Maya again, still signed in on the same device.

| # | Screen | Maya does | Taps |
|---|---|---|---|
| 1 | Sway home | Taps **Daybreak Coffee** | 1 |
| 2 | Shop | Taps **Check out** | 2 |
| 3 | Checkout | Sees $88, holds **Hold to pay $88** | 3 |
| 4 | Receipt | Lands here on its own | none |

**Result: 3 taps, under the target of 5.** Permission (`approve`) is still asked per order in lane D's code,
but it's invisible because Privy signs without pop-ups, so it costs no taps.

---

## 3. Seller (proposal: no seller screen exists in the app yet)

**Who:** Jordan. Holds $100 of Daybreak credit (demo credit) and would rather have $85 now.
**Goal:** turn store credit into money with no haggling.
**Before this starts:** Daybreak has issued Jordan $100 of credit (journey 4). For the demo, lane D's
`SeedDemo.s.sol` does steps 4 and 5 for him; these screens are the proposal for `/sell`.

| # | Screen | Jordan does | Jordan sees | On-chain |
|---|---|---|---|---|
| 1 | Sell `/sell` | Taps **Sign in to sell** | "Turn store credit into cash." Note: "Can't be drained. Your credit is locked with Sway while it's listed, then used up in the same moment you're paid." | Nothing |
| 2 | Sign-in sheet (Privy) | Continues with Google or email | Same sheet as the shopper | Nothing on-chain |
| 3 | Your credit | Taps **Sell** next to Daybreak | "$100 Daybreak Coffee, Sell now, get $85" with a demo credit tag | Read only: his credit balance and Daybreak's rates (`merchantRates`). |
| 4 | Sell it | Taps **List it and get $85** | Big green **$85**, the split (shoppers pay $88, Sway fee $3, you get $85), "Why $85?" (Sway sets one price per shop, at or above resale sites), first-time note that Sway holds the credit until it sells or he cancels | Nothing yet |
| 5 | Locking | Waits | "Locking your credit…" | First time only: `credit.setApprovalForAll(marketplace, true)`. Then `marketplace.createListing(merchantId, 10000)` moves his $100 of credit into escrow; price and payout lock from the shop's rates. `ListingCreated` emitted. |
| 6 | Listed | Waits, can tap **Cancel listing** | "Listed. You'll get $85 the moment a shopper uses it." Status: Waiting for a buyer. | Credit sits in escrow. Only two exits: a checkout burns it and pays him, or he cancels. |
| 7 | Sold | Checks back | "Your credit sold." Big green **+$85**. Balance $85.00. | Read only. The $85 arrived inside Maya's checkout transaction. |

**Taps:** Sign in (1), Google (2), Sell (3), List (4). **4 taps**, once.
**Cancel:** `cancelListing(...)` returns exactly $100 of credit. He sees "Listing cancelled. Your $100 of Daybreak credit is back in your account."

Why the credit can't be drained (for copy and judge Q&A): it's never a code. While listed it sits in the
contract. At checkout it's burned in the same transaction that pays Jordan, so nobody can spend it twice.

---

## 4. Merchant (minimal console, not built yet)

**Who:** Daybreak Coffee's owner. Issues store credit and needs to know when an order was paid with it.
**Before this starts:** Sway's admin registered Daybreak and its issuer account at deploy (`registerMerchant`) and set its rates (`setMerchantRates`).

| # | Screen | Merchant does | Merchant sees | On-chain |
|---|---|---|---|---|
| 1 | Merchant `/merchant` | Signs in with the Daybreak issuer account | Daybreak Coffee console | Nothing |
| 2 | Overview | Reads totals | Issued, Redeemed, Outstanding (in dollars) | Read only: `totalIssued`, `totalRedeemed`, `outstanding`. |
| 3 | Issue credit | Picks the recipient (demo seller), enters **$100**, taps **Issue $100 credit** | "$100 of demo credit issued to Jordan." | `credit.mintCredit(merchantId, to, 10000, memo)`. Only Daybreak's issuer can do this. `CreditIssued` emitted. |
| 4 | Paid orders | Reads the list after Maya's checkout | Row: order, $100 credit redeemed, Paid, record link. The signal to hand over the goods. | Read only: `CheckoutCompleted` events for Daybreak. |

Someone who isn't Daybreak's issuer sees: "This account can't issue credit for Daybreak Coffee." (`NotIssuer`)

---

## How the journeys connect (demo order)

1. **Merchant** issues $100 of Daybreak credit to Jordan. (`mintCredit`)
2. **Seller** lists it; Sway's rates set $88 for shoppers and $85 for Jordan. (`setApprovalForAll`, `createListing`)
3. **Shopper** holds to pay $88 for a $100 cart. (`approve`, `checkout`)
4. Jordan's sell page shows +$85. Sway's treasury has $3. Daybreak's console shows $100 redeemed.

For the video, steps 1 and 2 are done by `SeedDemo.s.sol`, so the recording focuses on the shopper.
Ending on Jordan's "+$85" closes the story.

---

## Open questions and requests for lane D

Also logged in `docs/STATUS.md` under "Blockers / cross-lane requests".

- **Q1. Is payment permission one time?** Answered: no, `use-checkout.ts` approves exactly the ask per order. It costs no taps because there are no pop-ups, so it stays.
- **Q2. Can Privy skip its confirm pop-up?** Answered: yes, `showWalletUIs: false` is already set.
- **Q3. How does a brand-new shopper get money in their account?** Still open. A fresh sign-in has $0, so a judge trying it cold hits `insufficient-funds`. Options: a pre-funded demo account, or a demo top-up button. Sending people to a faucet breaks "crypto is invisible".
- **Q4. Is the cart fixed at $100?** Answered: the seed carts each total exactly $100 and `cart.tsx` uses quantity 1.
- **New: hold to pay.** Approved UX for the pay button. Needs lane B (the hold button and fill) and lane D (call `pay()` when the hold completes, plus the tap-to-confirm backup).
- **New: drop "wallet" from Privy's sign-in options.** `providers.tsx` lists `"wallet"` in `loginMethods`, which puts a crypto-wallet option on the sign-in sheet. Email, Google and passkey are enough.

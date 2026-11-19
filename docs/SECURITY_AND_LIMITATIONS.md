# Security model & limitations

**Prototype on Arc testnet. Not audited. Not legal or financial advice.**

## What is enforced on-chain
- Only a merchant's registered issuer can mint its credit; no permissionless mint.
- Listings escrow exactly the listed credit; only the seller can cancel; refund is exact.
- `checkout` is atomic: seller payment and credit burn happen together or not at all.
- Each `orderId` settles at most once. Buyer is never charged above the `maxUsdcUnits` they signed.
- Credit of merchant A cannot pay merchant B (distinct token ids + explicit merchant check).
- Integer math only. ReentrancyGuard, Pausable, SafeERC20.
- Buyer pays exactly seller payout + Sway fee; prices are locked per listing, so an admin rate change
  cannot alter an existing listing. Buyer price rounds up, seller payout rounds down (never creates value).
- Admin powers (rates, treasury, pause) are centralized in one key for the demo.

## What is NOT real
- Merchants and credit are fictional; credit has no claim on any real business or goods.
- Merchant "redemption" is an on-chain event, not order fulfillment or POS integration.
- No issuer backing/prepayment verification, insurance, KYC, compliance, or production custody.
- Server quotes are advisory; the order token only prevents tampering with cart contents.
- If MockUSDC is in use, it is a demo token and not USDC.

## Risks for a real launch
Merchant default/insolvency, fraudulent issuance, transfer restrictions on gift cards/store credit,
money-transmission and prepaid-access regulation, stablecoin risk, shallow liquidity.

## Gift card swap (added Nov 19)
- **Simulated retailer.** The store gift-card system (`apps/web/server/giftcards.ts`) is a simulation for fictional
  stores; card numbers use a `7777…` prefix. A real deployment needs a retailer or exchange-partner API for balance
  checks and swaps — scraping retailer balance pages is not viable (CAPTCHAs, terms of service).
- **Custody.** Between swap and reveal, Sway holds the card value (vault). Buyers and sellers trust Sway as custodian,
  like existing exchanges; this likely carries money-transmission / AML obligations in production.
- **Why the swap matters.** A balance check alone can't prove who spent a card, because buyer and seller both know the PIN
  after a plain handoff. Swapping before listing means only Sway, then only the buyer, ever knows the live number.
- **Backing invariant.** On-chain credit is minted only after the old card is zeroed and the vault card exists;
  each minted unit is backed by a vaulted card of the same store + value. Reveal assigns one card per paid order (idempotent).
- **Reveal auth.** Card details are released only for a `CheckoutCompleted` in a successful tx whose `buyer` signed
  the reveal message (EIP-191). PINs are AES-256-GCM encrypted at rest.
- **Server issuer key.** `MERCHANT_1_ISSUER_PRIVATE_KEY` lives in server env so the server can mint for sales and send
  new sellers 0.2 testnet USDC of gas. If that key leaked, an attacker could mint unbacked demo credit. Testnet only.
- **Crash window.** If the server crashes mid-swap, value can briefly exist on both old and new cards (never neither);
  credit is not minted until both writes succeed. A sale stuck in `MINTING` needs manual review.

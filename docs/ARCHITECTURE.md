# Architecture

```text
 Browser (Next.js 16 + Tailwind v4 + Privy embedded wallet + wagmi/viem)
   │  GET /api/quote        │ signs approve + checkout     │ GET /api/orders/:id
   ▼                        ▼                              ▼
 Next.js route handlers (apps/web/app/api, same origin, no DB)
   │  reads chain state + events; computes ADVISORY quote; HMAC-signed order tokens
   ▼
 Arc testnet (chain 5042002)
   MerchantCredit (ERC-1155, tokenId = merchantId, 1 unit = $0.01)
   SwayMarketplace (escrow listings + atomic checkout)
   USDC ERC-20 0x3600…0000 (6dp)  — or MockUSDC fallback, labeled
```

## Pricing & revenue
Admin sets `setMerchantRates(merchantId, buyerPriceBps, sellerPayoutBps)` (demo 8800 / 8500).
`createListing(merchantId, creditCents)` locks `askUsdcUnits = ceil(face × buyerBps)` and
`sellerPayoutUnits = floor(face × sellerBps)`; Sway's fee is the difference and goes to `treasury`.
With 6-decimal USDC every split is exact (1 cent = 10,000 units).

## Atomic checkout (one transaction)
1. Validate listing Active, merchant matches, orderId unused, ask ≤ buyer max, credit == order total.
2. Mark order settled + listing Filled (effects before interactions).
3. `USDC.transferFrom(buyer → seller, sellerPayout)` and `USDC.transferFrom(buyer → treasury, fee)`.
4. `MerchantCredit.redeem(merchantId, credit, orderId)` — burns marketplace escrow.
5. Emit `CheckoutCompleted(…, usdcUnits, sellerPayoutUnits, feeUnits, listingId)` — the merchant's (demo) receipt.

Any failure reverts all of it. Sources of truth: **chain** for balances/listings/payment; `server/seed.ts` for catalog.

## Why no database
Orders are stateless HMAC-signed tokens; payment state is `orderSettled(orderId)` + `CheckoutCompleted` on chain.
Nothing to provision, nothing to drift.

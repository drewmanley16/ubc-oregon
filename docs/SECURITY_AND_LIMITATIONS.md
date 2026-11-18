# Security model & limitations

**Prototype on Arc testnet. Not audited. Not legal or financial advice.**

## What is enforced on-chain
- Only a merchant's registered issuer can mint its credit; no permissionless mint.
- Listings escrow exactly the listed credit; only the seller can cancel; refund is exact.
- `checkout` is atomic: seller payment and credit burn happen together or not at all.
- Each `orderId` settles at most once. Buyer is never charged above the `maxUsdcUnits` they signed.
- Credit of merchant A cannot pay merchant B (distinct token ids + explicit merchant check).
- Integer math only. ReentrancyGuard, Pausable, SafeERC20.

## What is NOT real
- Merchants and credit are fictional; credit has no claim on any real business or goods.
- Merchant "redemption" is an on-chain event, not order fulfillment or POS integration.
- No issuer backing/prepayment verification, insurance, KYC, compliance, or production custody.
- Server quotes are advisory; the order token only prevents tampering with cart contents.
- If MockUSDC is in use, it is a demo token and not USDC.

## Risks for a real launch
Merchant default/insolvency, fraudulent issuance, transfer restrictions on gift cards/store credit,
money-transmission and prepaid-access regulation, stablecoin risk, shallow liquidity.

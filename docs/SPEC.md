# SWAY: Smart Checkout for Discounted Merchant Credit
## UBC 2026 Hackathon | Claude Build Handoff

**Status:** Implementation-ready MVP specification  
**Date prepared:** November 18, 2026  
**Team:** Four members: UX, visual design, backend, and technical lead (smart contracts + frontend + integration)  
**Build window:** Now through **Friday, November 20, 2026 at 10:00 a.m. Pacific / 12:00 p.m. Central Standard Time**  
**Finals:** Saturday, November 21; finalists receive 4-minute pitch plus 2-minute Q&A  
**Primary track:** Consumer Applications  
**Recommended optional chain award:** Best Use of Arc  
**Chain:** Arc **testnet**, subject to first-hour deployment smoke test  
**Source rules:** User-provided *Hackathon Guide UBC 26*, especially pages 2–3, 8, 10, 16–18, and 21. https://ubc-hackathon-2026.devpost.com/

> **START HERE, CLAUDE:** You are the implementation partner for Sway. Build a complete hackathon MVP, not a theoretical architecture. Treat the acceptance tests, invariants, API contracts, and scope cutline in this document as authoritative. Do not claim integrations, liquidity, gift-card backing, or production security that are not present. Ask for credentials only when technically necessary, and otherwise use deterministic demo fixtures. Keep the app runnable locally from one README and a `.env.example`.

---

## 1. One-minute pitch

**Sway automatically purchases discounted, tokenized merchant credit and spends it at checkout, saving customers money with one click.**

A shopper has a **$100** cart at a demo coffee shop. Another customer owns **$100** of valid, merchant-issued prepaid credit but wants liquidity, so they list that credit for **$88 USDC**. Sway finds the listing and, in **one atomic on-chain transaction**, transfers **$88 USDC** to the seller and consumes **$100 of merchant credit** toward the shopper's order. The buyer saves $12 before gas or other fees. The merchant honors the $100 credit because, in the real economic model, it was already purchased or otherwise legitimately issued.

This is **not** a gift-card NFT marketplace and **not** a method of magically converting any gift-card code into crypto. It is a smart checkout and secondary market for **merchant-authorized, on-chain stored value**.

**Customer-facing message:** "Your $100 order costs $88. Save $12 with Sway." Do not lead with wallets, bridging, ERC-1155, or gas.

### Key differentiator

The marketplace and checkout are coupled. Users do **not** need to manually search for a discounted card, buy it, extract a code, and paste it at checkout. The router quotes valid inventory and atomically completes discounted checkout.

### What the demo proves

1. Merchant issues $100 of on-chain credit to a seller.
2. Seller escrows that credit in a fixed-price listing for $88 USDC.
3. Shopper opens a $100 merchant checkout and sees a verifiable $88 quote.
4. Shopper approves spending $88 USDC, then confirms checkout.
5. One checkout transaction transfers payment to seller, burns $100 merchant credit, marks the merchant order paid, and emits events.
6. Checkout success page shows $100 retail value, $88 paid, $12 savings, transaction hash.
7. Seller dashboard shows $88 USDC received; listing inventory is now 0.

**Important caveat:** All demo assets and merchants are fictitious, and the demo credit has no claim on a real merchant. Backing and redemption integrations would be required before live commerce.

---

## 2. Hackathon positioning and rules

### Track and chain rationale

- **Primary track = Consumer Applications:** requires actual blockchain interaction and working user-facing web/mobile frontend. Judges value invisible crypto, thoughtful UX, and repeatable user value.
- **Chain award = Arc:** Arc is EVM-compatible and built around stablecoin payments. The event offers **$1,000 Best Use of Arc per main track**, while Solana offers **$1,500**. Choose **one**, not both. The shortest path to a convincing working atomic checkout with one Solidity lead is Arc + Foundry.
- **Fallback:** If Arc tooling is blocking checkout after the initial smoke test, use another EVM testnet to deliver Consumer Applications track. **Do not claim Arc award eligibility** if core on-chain functionality is not on Arc. Solana migration is not worth doing just for a larger prize at this stage.
- **Bounties:** No bounty is automatically relevant. QuickNode Streams could be added *only if* it genuinely powers live on-chain data and has a configured filtered Stream and webhook/database destination. Do not bolt on ElevenLabs, Gemini Prediction Markets, or Grok solely to collect a bounty.
- **Rules:** One main track; optional one chain award; eligible multiple bounties; complete public GitHub repo, deployed demo, README and 2–3 minute accessible video. Projects must be substantially built during the hackathon. Teams of 1–4 recommended. Judges evaluate execution, UX, innovation, impact and demo. Team must be present in person at closing ceremony to qualify for prizes.

### Arc technical notes, verify before implementing

- Arc testnet chain ID **5042002** (confirm against current Circle official docs).
- Circle's Arc testnet uses **USDC as native gas**. Contract-based USDC ERC-20 transfers have their own address/interface; do **not** confuse native gas units (18-decimal view) with token accounting (normally 6 decimals). Confirm currently supported ERC-20 USDC mechanism and contract address from Circle documentation before deployment. Never guess a token address.
- Foundry (`forge`, `anvil`, `cast`) and viem/wagmi for frontend calls.
- Public RPC, explorer, faucet URL must be taken from the current **official** `https://docs.arc.io/` and `https://faucet.circle.com/`. Record exact verified values in README.
- Use official testnet USDC if it works end-to-end; otherwise deploy a clearly labeled **MockUSDC** *for demo trading only* and acquire native testnet USDC for gas. Do not describe MockUSDC as real USDC.

---

## 3. Core product requirements

### Personas

1. **Buyer:** Wants instant savings on an ordinary checkout. Primary UX.
2. **Seller:** Has unused merchant-specific prepaid credit and wants dollars/USDC now.
3. **Merchant:** Issues, accepts, and burns prepaid credit when honoring sales.

### Must-have screens

1. **Landing/demo store:** 3 realistic fictional merchants, e.g., Daybreak Coffee, Northline Apparel, Parkside Market. Merchant selection and sample cart. Do not use unlicensed logos of real retailers.
2. **Checkout:** Cart total, suggested discount, live source listing, exact price breakdown, countdown/stale quote state, confirm action. Show connected wallet only in a compact secondary place.
3. **Transaction states:** Connect/approve (if needed), processing, confirmed, failed/retry; actual transaction confirmations, no fake success.
4. **Success/receipt:** Amount saved, seller paid, merchant credit redeemed, block explorer link.
5. **Seller console:** Merchant balances, create listing, ask price, active listings, sale proceeds.
6. **Merchant console (minimal):** Issue test credit to a seller and view credited/redeemed totals and sale receipts.

### Must-have features

- Merchant issuance restricted to authorized addresses.
- Escrowed credit listings with fixed price and cancel flow.
- Real on-chain quote check, allowance check, balance check and atomic checkout.
- Partial fills are optional; default initial implementation to **single fixed $100 listing and full redemption** to reduce risk. Add partial fill only when complete.
- Clear order IDs with replay protection.
- On-chain events indexed for observable source of truth.
- Wallet connection through familiar library; do not promise gasless checkout unless it is implemented.
- Deterministic seed script for the demo.
- Polished responsive UI, intentional typography and useful skeleton/loading/empty/error states.

### Explicitly out of scope

- Real Starbucks/Nike/Amazon gift card code import or balance verification.
- Real physical retailer POS integrations, Stripe, Apple Pay, fiat onramps, or Visa cards.
- Cross-chain swaps, bridge routing, lending, AMMs, merchant bankruptcy insurance.
- Autonomous AI agents, unverified yield claims, arbitrary external inventory.
- Production custody, compliance claims, fraud guarantees, or promises of a deployed production business.
- Smart-contract upgradability or unnecessary governance.

---

## 4. Economic model and trust assumptions

**Important:** An on-chain credit token is a **claim**, not cash. Merchants must agree to honor it. For a real implementation, credits should only be minted after a confirmed prepayment or authorized promotional issuance under documented terms. A tokenized third-party gift card is not automatically valid, transferable, fractionalizable, or spendable.

Example with no fees:

| Actor | Before | After |
|---|---|---|
| Merchant | Previously collected $100 for $100 prepaid credit | Delivers $100 of goods/services; credit liability discharged |
| Seller | Holds $100 merchant credit | Transfers value claim for $88 USDC, gives up $12 discount |
| Buyer | Owes $100 at checkout | Pays $88 USDC for $100 order, saves $12 |
| Sway | Zero | Demonstrates matching, transfer and redemption; no mandatory fee |

The demo **simulates** the merchant issuance backing rather than claiming the merchant really received $100. Show a "demo credit" label.

**Price and savings math:** `savings = face_value - usdc_amount_paid - explicit_checkout_fees`, and display gross savings separately from net savings if gas is estimated. Do not promise exactly $12 saved if gas or platform fees apply.

**Risk assumptions:** Merchant default/redemption failure, fraud, price volatility of store credit, USDC risk, transaction fees, shallow liquidity, and regulatory/contractual transfer restrictions. For MVP, the merchant redemption is an on-chain demo event/record, not real-world order fulfillment.

---

## 5. Architecture

```text
 Browser: Next.js / TypeScript / Tailwind / shadcn/ui / wagmi / viem
   |              |                           |
   | GET quote    | wallet signing            | receipt/status
   v              v                           v
 Backend API (Next.js route handlers or Fastify; choose one)
   | read indexed events / read contract state
   | compute inventory and candidate quote, NEVER authority for settlement
   v
 Arc Testnet smart contracts
   - MerchantCredit (ERC-1155, integer units representing $0.01 credit)
   - SwayMarketplace (escrow listings + atomic checkout)
   - DemoUSDC/official testnet USDC according to verified network support
   |
   +-- merchant `mintCredit` -> seller
   +-- seller `createListing` -> escrow credit
   +-- buyer `checkout` -> USDC to seller + credit burn + order paid event

 Optional Supabase/PostgreSQL:
   merchants, sample products, carts, UI receipts, tx sync cache
   (Never treat SQL row state as the source of on-chain balances.)
```

### Chosen minimal design

**MerchantCredit ERC-1155**
- One `tokenId` per fictional merchant, stored in `merchantId -> issuer address` mapping.
- Credit amount is **integer cents**, not floating point. `10000` units represents $100.00.
- An authorized merchant or app admin (hackathon demo only) can mint. Store an event documenting issuer and credit units.
- Marketplace can burn only its own escrowed credit as part of checkout. No user can force-burn unrelated balances.
- Do not implement arbitrary permissionless mint.

**SwayMarketplace**
- `createListing(merchantId, creditCents, askUsdcUnits)` moves exactly `creditCents` to contract escrow. `askUsdcUnits` uses token's actual decimals, fetched/verified at deployment. Persist `seller`, `merchantId`, `creditCents`, `askUsdcUnits`, `active`.
- `cancelListing(listingId)` only by seller; returns credit; reverts after fill.
- `checkout(listingId, orderId, expectedMerchantId, maxUsdcUnits, expectedCreditCents)` does all of:
  1. Validate active listing and exact merchant.
  2. Validate `orderId` unique for this merchant / configured checkout scope.
  3. Validate listing price <= `maxUsdcUnits` and exact face amount satisfies order.
  4. Mark order used and listing filled before external transfer calls.
  5. Safe ERC-20 `transferFrom(buyer, seller, askUsdcUnits)`.
  6. Burn escrowed merchant credits from marketplace balance.
  7. Emit `CheckoutCompleted(orderId, merchantId, buyer, seller, creditCents, usdcUnits, listingId)`.
- Use `ReentrancyGuard`, `Pausable`, `SafeERC20`, role checks, custom errors.
- Prefer **one fixed-size listing per whole cart** for MVP, rather than complicated optimization across many offers.
- Merchant recognizes `CheckoutCompleted` as the **demo** payment/redemption receipt. Production merchant-side authorization and fulfillment are NOT implemented.

### Important contract invariants

1. Outstanding merchant credit can only increase via authorized issuance.
2. A listing cannot sell more credit than was escrowed.
3. Every order ID can be settled at most once.
4. A successful checkout pays the seller and burns exactly the credit covering the order, atomically. If any step fails, all state rolls back.
5. Buyer cannot be charged above the maximum quote they signed.
6. Credits of merchant A cannot pay for a checkout at merchant B.
7. Only seller can cancel their outstanding listing, and cancellation returns the exact amount.
8. Integer math only; no rounding-based free credit.
9. Failed/wrong-chain/expired quote must show failure without issuing a fake receipt.

### Signature / transaction flow

Seller: `setApprovalForAll(marketplace, true)` -> `createListing(...)`.

Buyer: connect wallet -> `GET /api/quote?merchantId=...&amountCents=10000` -> front-end checks current contract state -> `approve(USDC, marketplace, amount)` if required -> `checkout(...)` -> wait for confirmed receipt -> display transaction hash. The approve step is a separate transaction, while checkout itself is atomic. If possible use permit-style auth only if natively supported and time permits.

**Security note:** A server quote is advisory only. On-chain `maxUsdcUnits`, listing validity and merchant matching are mandatory. No private keys should be placed in the frontend or committed. Test keys only in ignored `.env`.

---

## 6. API and shared TypeScript contracts

All frontend/backend amounts should be serialized as **decimal integer strings** for token balances; face value in integer cents. Avoid JS floating point for monetary arithmetic.

```ts
type Merchant = {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string;
  creditTokenId: string;
};

type MarketplaceListing = {
  listingId: string;
  merchantId: number;
  sellerAddress: `0x${string}`;
  faceValueCents: string;
  askUsdcUnits: string;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
  txHash: `0x${string}`;
};

type CheckoutQuote = {
  quoteId: string;                  // ephemeral request correlation only
  merchantId: number;
  orderId: `0x${string}`;           // random unique bytes32, not PII
  listingId: string;
  faceValueCents: string;
  askUsdcUnits: string;
  grossSavingsCents: string;
  currency: 'USDC';
  chainId: number;
  expiresAt: string;                // UI freshness indicator only
  executable: boolean;
};
```

| Method / endpoint | Responsibility | Source of truth |
|---|---|---|
| `GET /api/merchants` | Demo shops, imagery, products | Local seed database |
| `GET /api/merchants/:id/products` | Demo catalog | Local seed database |
| `GET /api/listings?merchantId=N` | Read live listings | Chain reads/events, optional cache |
| `GET /api/quote?merchantId=N&amountCents=X` | Choose cheapest **exact-cover** listing for the demo | Current chain state |
| `POST /api/orders` | Create immutable demo cart/order reference and random bytes32 order ID | Backend database |
| `GET /api/orders/:id` | Show transaction status / receipt | Confirmed chain transaction |
| Contract `mintCredit` | Issuer creates merchant credit | On-chain |
| Contract `createListing` | Seller escrows credit at fixed USDC price | On-chain |
| Contract `checkout` | Single atomic swap + credit redemption | On-chain |

**Quoting algorithm, MVP:** Filter active listings by matching merchant, exact face cents, ask > 0, escrowed/active chain state. Sort by effective USDC total ascending and listingId tie-breaker. If none, show "No savings available right now" and disable checkout. No hidden fabricated offer.

**Optional improvement after MVP:** Allow a larger listing to be partially filled with proportional ask units and exact ceiling rounding; this must come with thorough invariant tests. Avoid otherwise.

---

## 7. Repo structure

```text
sway/
  README.md
  .env.example
  package.json                  # pnpm workspaces or npm workspaces
  apps/
    web/
      app/
        page.tsx
        store/[slug]/page.tsx
        checkout/[orderId]/page.tsx
        receipt/[orderId]/page.tsx
        sell/page.tsx
        merchant/page.tsx
      components/
      lib/contracts.ts
      lib/format.ts
    api/                        # omit if using Next.js API routes
      src/routes/
      src/quote/
      src/indexer/
  packages/
    shared/src/types.ts
    contracts/
      src/MerchantCredit.sol
      src/SwayMarketplace.sol
      src/MockUSDC.sol          # only if necessary, labeled demo
      script/Deploy.s.sol
      script/SeedDemo.s.sol
      test/MerchantCredit.t.sol
      test/SwayMarketplace.t.sol
      foundry.toml
      deployments/arc-testnet.json
  docs/
    ARCHITECTURE.md
    DEMO_SCRIPT.md
    SECURITY_AND_LIMITATIONS.md
    screenshots/
```

**Recommended tooling:** Next.js App Router + TypeScript + Tailwind + shadcn/ui + lucide-react + viem/wagmi + Foundry + OpenZeppelin. Backend teammate may use Next.js route handlers and PostgreSQL/Supabase if familiar; avoid a separate microservice unless it is already trivial for the team. Use Vercel to deploy the frontend if configured, and keep the backend same-origin to avoid CORS issues.

---

## 8. Team ownership and precise deliverables

### Member A: UX (not visual design)

**Own:** User flow, functional wireframes, content states, friction reduction and QA.

Deliver:
- 3 role journeys: buyer, seller, merchant.
- Screen-state matrix (empty, loading, no offer, quote available, needs approval, pending, confirmed, rejected, failed).
- Clickable flow or structured handoff covering all screens.
- Microcopy for quote, checkout, wallet connection, errors, and receipt.
- Test demo as first-time user and identify blockers.

**Acceptance:** A judge understands the savings proposition in 5 seconds and completes checkout with minimal coaching.

### Member B: Visual designer

**Own:** Brand, visual system, components, assets, responsive polish.

Deliver:
- Figma desktop + mobile layouts for landing, checkout, listing, and success.
- Tokens: typography scale, spacing, radii, colors and component states.
- SVG logo/mark and original merchant demo illustrations/photos as permitted.
- Components: product cards, savings quote, order summary, progress, receipt, dashboard.
- Design QA against running app.

**Direction:** Premium consumer fintech, calm neutrals with one vivid savings accent, highly legible large prices, subtle motion. Avoid a generic purple crypto dashboard or giant wallet-first hero.

### Member C: Backend engineer

**Own:** Application data, quote service, indexing, order state, demo seeds.

Deliver:
- Defined REST/route-handler endpoints in section 6.
- Seeded merchants/products/carts and persistent demo order IDs.
- Listing reads via on-chain calls; chain state wins over cache.
- Best-offer exact-match quote selection with expiration and error paths.
- Read/parse `CheckoutCompleted` events to populate receipt API.
- `.env.example` backend values and backend tests.

**Important:** Backend MUST NOT claim that a checkout succeeded until a confirmed chain receipt is observed. Quote snapshots are not binding; frontend passes on-chain max price.

### Member D: Technical lead (user)

**Own:** Smart contracts, chain config, frontend implementation, wallet flow, integration, CI, final demo and submission.

Deliver:
- MerchantCredit.sol, SwayMarketplace.sol, deploy and seed scripts.
- Contract unit/invariant tests with Foundry.
- Arc testnet deployment with verifiable addresses and explorer links.
- Frontend integration, transaction state handling, reusable components.
- End-to-end demo/recording, README, Devpost submission.

**Workload note:** This is the critical path and larger than any other role. Keep UX/design teammate outputs immediately implementable (components/variables, not just moodboards). Have backend engineer also take receipt-page wiring if capacity is available. Do not spend a day perfecting architecture while checkout is broken.

### Team handoff checkpoints

- **T+2 hours:** UX screen flows, design base tokens, API types agreed, testnet wallet funded and first contract deployed.
- **T+6 hours:** Contract createListing + checkout tests passing; quote endpoint returns a real listing; design has complete checkout/success.
- **T+12 hours:** Buyer flow on deployed testnet from seeded listing through receipt.
- **T+24 hours:** Seller flow and merchant console; responsive polish; error handling; 2-minute rehearsal.
- **By Thursday evening, Nov 19 Pacific:** Freeze features. Record demo and prepare README/screenshots.
- **Friday morning, Nov 20:** Smoke test, upload video, submit before 10 a.m. Pacific. Do not leave upload for deadline minute.

---

## 9. Build order: ship a vertical slice first

### Phase 0: 60-minute spike

1. `forge init` and configure Arc testnet from official documentation.
2. Fund testnet deployer with native testnet USDC for gas.
3. Deploy a minimal ERC-1155 and a test ERC-20 transfer, verify RPC, explorer and wallet compatibility.
4. If any key dependency cannot be resolved in the first hour, fallback to a supported EVM testnet and choose **no chain award**. Working product > chain vanity.

### Phase 1: Non-negotiable working backend/contracts

1. `MerchantCredit` with merchant role and mint/burn.
2. `SwayMarketplace` listing escrow, cancel, `checkout` atomic settlement.
3. Foundry tests: happy path, unauthorized mint, insufficient escrow, wrong merchant, order replay, max-price slippage, cancellation, failed transfer, no duplicate redemption, seller payout amount.
4. Deploy on Arc and seed demo: Merchant A credit $100 -> seller; seller listing ask $88.
5. Document deployed contracts and actual token decimals.

### Phase 2: First buyer transaction

1. Store/cart + quote UI.
2. Connect wallet and approve token spending.
3. Send `checkout`, wait for receipt, show success/transaction hash.
4. Test with two distinct accounts: seller and buyer, plus merchant issuer.
5. Re-run seeded fixture until demo flow is repeatable.

### Phase 3: Seller and merchant flows

1. Seller list/cancel and proceeds.
2. Merchant mint demo credits and view redemption event.
3. Sync listing status from chain; show no offers after fill.

### Phase 4: Product finish

1. Mobile/responsive refinement and accessible contrast.
2. Error/retry paths, deterministic end-to-end smoke script.
3. README, architecture diagram, threat model/limits, demo video.
4. Optional QuickNode Streams only if all core flows are complete and the required filtered Stream + destination are operational.

### Scope cutline

If behind schedule by Thursday evening, preserve **one working merchant, one seller, one listing, one buyer, one checkout, one receipt**. Remove multi-merchant routing, seller dashboard polish, animations, indexers, and all optional bounties before compromising the successful on-chain checkout.

---

## 10. Tests and definition of done

**Contract tests**
- Issuer-only mint.
- Exact cents and USDC units; no float conversion or silent rounding.
- Escrow balances accurate before and after listing.
- Seller-only cancel and exact refund.
- Seller paid exactly the ask amount.
- Burn removes exact face credit.
- Duplicate order ID rejected.
- Buyer maximum price enforced.
- Wrong merchant listing rejected.
- Failed USDC transfer reverts all effects.
- Filled listing cannot be re-used.
- Reentrancy protections hold.

**Frontend / integration**
- Quote reflects available actual listing and is never hard-coded into runtime checkout logic.
- Displayed merchant and amount match signed checkout transaction.
- Approve state and wallet chain changes handled.
- User rejecting wallet signature returns to checkout gracefully.
- Successful transaction shows hash, receipts and real amounts.
- Pending transaction cannot be falsely marked successful.
- Double-click cannot accidentally submit two orders.
- After checkout, reloading receipt reflects chain-confirmed state.
- Demo works on mobile viewport and ordinary desktop.

**Definition of done:** An evaluator can follow the README from clone -> install -> configure -> run -> seed -> see demo, and can inspect the deployed chain transaction to see an actual seller payout and merchant-credit redemption. A publicly accessible frontend, repository, and 2–3 minute video are ready before deadline.

---

## 11. Four-minute live finalist pitch

**0:00–0:35, hook:** "You have a $100 cart. Someone else has $100 of store credit they would rather turn into $88 cash. Today, connecting those two takes multiple websites, manual codes, and trust. Sway makes it one checkout."

**0:35–1:15, setup:** Merchant issues demo $100 credit. Seller lists for $88. Explain credit originated at issuer and is escrowed, not an arbitrary unverified gift card screenshot.

**1:15–2:30, live demo:** Buyer opens $100 cart, sees $12 discount, confirms, on-chain transaction completes, receipt and explorer appear. Show seller receives $88 and credit burns.

**2:30–3:15, technical differentiator:** Explain single atomic settlement, escrow/inventory guarantees, quote slippage control, per-merchant credits, no double redemption. Native USDC gas/Arc specifics if indeed deployed on Arc.

**3:15–4:00, expansion and risk:** Merchant integrations, liquidity aggregation, multiple offers, wallet abstraction. Explicitly note issuer backing and redemption relationships are required for real launch.

**Judges' likely questions:**
- Why blockchain? For transferable, programmable merchant liabilities and atomic resale/redemption without a single database controlling every transfer. A normal database may be simpler for one merchant; interoperability across merchants/marketplaces is the long-term hypothesis.
- Who funds the $12 discount? The seller willingly accepts $88 for their $100 credit, not the merchant or protocol.
- Who backs the gift card? Merchant liability; demo assets are not backed by real goods.
- How do you stop double spending? Escrow credit is burned atomically on settlement; merchant external fulfillment remains a distinct integration problem.
- Why not existing gift-card resale sites? Automatic checkout routing and atomic programmable settlement versus manual code transfer; real issuer permissions still required.
- What if seller cancels during quote? On-chain transaction reverts; frontend must refresh and re-quote.
- What about merchant insolvency? Credit holders face merchant default risk. No insurance is provided.

---

## 12. Required Devpost submission package

- [ ] Project title, one-paragraph pitch, member roster.
- [ ] Primary track: **Consumer Applications** (exactly one).
- [ ] Chain award: **Best Use of Arc** only if core is actually deployed on Arc; otherwise None.
- [ ] Only qualified bounties, with evidence meeting their technical requirements.
- [ ] Answers: what built, problem solved, how it works, why unique, what next.
- [ ] Technology list and sponsors actually used.
- [ ] Public GitHub repository with meaningful code and setup instructions.
- [ ] Deployed, testable frontend and seeded demo.
- [ ] README with architecture, economics/risk assumptions, deployment addresses, chain info and limitations.
- [ ] 2–3-minute publicly accessible Google Drive/YouTube demo video.
- [ ] Attend in-person closing ceremony if competing for prizes.
- [ ] Submit by **Nov 20, 2026 at 12:00 p.m. CST = 10:00 a.m. PST**.

---

## 13. Claude implementation instructions (paste directly into Claude Code)

> Build the **SWAY** monorepo specified in `SWAY_UBC_2026_CLAUDE_HANDOFF.md`. Start by scaffolding the workspace and writing working Foundry smart contracts for authorized merchant credit minting, escrowed fixed-price listings and an atomic USDC-for-credit checkout/burn. Use realistic but fictional merchant seed data. Treat all credit and stablecoin quantities as integer units and enforce the invariants in section 5. Write Foundry tests before integrating the UI. Then build a refined Next.js consumer checkout experience with actual chain reads, allowance handling, transaction submission, and confirmation receipts. Expose an API that quotes only genuinely active exact-cover listings. Keep official Arc network settings and official testnet USDC addresses configurable; verify them instead of guessing. If a real testnet USDC contract is unavailable, use a distinctly labeled mock ERC-20 for trading while retaining genuine Arc testnet transactions and gas, and disclose it clearly. Never fake a blockchain confirmation. Keep `.env.example`, scripts, contract deployments JSON, README and seed instructions current. Optimize for a reliable end-to-end demo before UBC's November 20, 10 a.m. Pacific deadline. Follow the explicit scope cutline if time becomes constrained.

### Implementation agent output checklist

When you finish each meaningful stage, report:
1. What was implemented, with file paths.
2. Commands run, pass/fail test results, and actual deployment tx/addresses if available.
3. Any blockers or unverified dependencies.
4. Exactly what the next teammate needs to do.

**Do not report a step as complete merely because files were generated.** Running deploy/test/UI evidence is required.

---

## 14. Verified source hierarchy and boundaries

**Hackathon rules:** User-supplied *Hackathon Guide UBC 26*, pages 1–3 (tracks, timeline), 4–5 (prizes), 8 (Consumer), 10 (Arc), 16–18 (submission and judging), 21 (FAQ); official Devpost https://ubc-hackathon-2026.devpost.com/.

**External implementation guidance:** Official Circle Arc documentation https://docs.arc.io/ and Circle faucet https://faucet.circle.com/. Network or contract constants must be revalidated from official docs before live deployment.

**Author recommendations, not hackathon requirements:** Name Sway, Arc choice, architecture, tech stack, demo commerce model, fictional merchants, checkpoints, all UI requirements, and contract design.

**Compliance note:** This is a prototype, not legal or financial advice. Gift card issuance, prepaid access, resale rights, cash redemption, money transmission, consumer-protection obligations, and merchant contracts require specialized review before production.

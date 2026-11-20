# Sway — agent & teammate operating manual

Read this file first. Then read **your lane file** in `docs/lanes/`, then `docs/STATUS.md`.
Full product spec: `docs/SPEC.md` (authoritative for acceptance tests, invariants, scope cutline).

**Sway**: gift cards that can't be drained. A seller submits a gift card; Sway verifies it and **swaps** its
value onto a new card number only Sway knows (old number → $0), mints matching on-chain credit, and the seller lists
it. A buyer pays $88 USDC for the $100 card in ONE `checkout` transaction on **Arc testnet** (seller $85, Sway $3),
then reveals the new number + PIN with a wallet signature. The store gift-card system is **simulated** (fictional stores).

**Deadline: Fri Nov 20 2026, 10:00 a.m. Pacific** (Devpost submission). Feature freeze Thu Nov 19 evening.

## 1. Pick your lane

| Lane | Person | Lane file | Owns (may edit freely) |
|---|---|---|---|
| **A — UX** | UX teammate | `docs/lanes/A-ux.md` | `docs/ux/**`, `apps/web/content/copy.ts` |
| **B — Visual design** | Design teammate | `docs/lanes/B-design.md` | `docs/design/**`, `apps/web/app/globals.css`, `apps/web/components/ui/**`, styling inside `apps/web/components/sway/**`, `apps/web/public/brand/**`, `apps/web/public/merchants/**` |
| **C — Backend** | Backend teammate | `docs/lanes/C-backend.md` | `apps/web/app/api/**`, `apps/web/server/**`, `apps/web/lib/api.ts` |
| **D — Tech lead** | Drew | `docs/lanes/D-techlead.md` | `packages/contracts/**`, `apps/web/app/**/page.tsx`, `apps/web/app/providers.tsx`, `apps/web/app/layout.tsx`, `apps/web/lib/wallet/**`, `apps/web/lib/tx/**`, `apps/web/lib/contracts.ts`, `.github/**`, root config |

If you're an agent and the human hasn't told you their lane, **ask** before editing anything.

## 2. Shared contracts — DO NOT change unilaterally

These are the seams between lanes. Changing one breaks someone else. To change: open a PR that
updates every consumer, tag the owning lanes, and log it in `docs/STATUS.md` → "Contract changes".

| Contract | File | Producer → Consumer |
|---|---|---|
| Solidity interfaces (events, errors, signatures) | `packages/contracts/src/interfaces/*.sol` | D → C, D |
| Generated ABIs | `packages/shared/src/abi/*` (run `pnpm abi`, never hand-edit) | D → C, D |
| API types | `packages/shared/src/types.ts` | C ↔ D |
| Chain constants (verified) | `packages/shared/src/chain.ts` | D → all |
| Money helpers | `packages/shared/src/money.ts` | all |
| Deployed addresses | `packages/contracts/deployments/arc-testnet.json` | D → C, D |
| Component **props** | `apps/web/components/sway/*.tsx` | B styles, D passes data — props change needs B+D |
| Wallet surface | `apps/web/lib/wallet/types.ts` | D → pages |
| Checkout state machine | `apps/web/lib/tx/types.ts` | D ↔ A (states) ↔ B (visuals) |
| All UI strings | `apps/web/content/copy.ts` | A → everyone (never hard-code copy in JSX) |

## 3. Non-negotiable rules (from spec — judges and correctness depend on these)

1. **Never fake a blockchain result.** "Paid/confirmed" only after a tx receipt with `status === "success"` /
   a confirmed `CheckoutCompleted` log. No optimistic success screens.
2. **Integer money only.** Amounts are `bigint` in code and decimal-integer **strings** over JSON.
   `*Cents` = $0.01 credit units; `*UsdcUnits` = ERC-20 units (Arc USDC = **6 decimals**).
   Never use JS `number`/floats for money. Use `packages/shared/src/money.ts`.
3. **Arc USDC gotcha:** native gas USDC (18 decimals) and ERC-20 USDC `0x3600…0000` (6 decimals) are the
   **same balance**. Show one USDC balance. Do token math only via the ERC-20 interface.
4. **Never use anvil/hardhat default keys on Arc.** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` is blocklisted.
5. **Server quote is advisory.** Settlement safety comes from on-chain `maxUsdcUnits`, merchant match, and exact credit.
6. **No secrets in git.** Keys only in `.env` / `.env.local` (gitignored). Never `NEXT_PUBLIC_` a private key.
7. **Honesty.** Fictional merchants, "demo credit" label, no real retailer names/logos, MockUSDC (if used) labeled
   "Demo USDC". Don't claim gasless, backing, or integrations that don't exist.
8. **Crypto stays invisible in primary UX.** Lead with savings. Wallet/address only in compact secondary spots.
   Users "Sign in" (Privy email/Google), they don't "connect a wallet".
9. **Scope cutline** (spec §9): if behind on Thursday evening, protect *one merchant → one listing → one checkout
   → one receipt* above everything else.

## 4. Workflow

- Branch: `lane-<a|b|c|d>/<short-topic>` → PR into `main`. Small PRs, merge often. Don't push to `main` directly
  except Drew for integration fixes.
- Stay inside your lane's paths. Need a change elsewhere? Leave a `TODO(lane-X): …` comment + note in `docs/STATUS.md`.
- Before every PR: `pnpm check` (contracts tests → ABI export → typecheck → build) must pass.
- Update your lane's checklist in `docs/STATUS.md` when you finish something — with evidence (test output,
  tx hash, screenshot path). "Files were generated" is not done.
- `grep -rn "TODO(lane-<x>)"` lists your lane's open stubs.

## 5. Commands

```bash
pnpm install                 # once (also: git submodule update --init --recursive)
pnpm dev                     # web app at http://localhost:3000
pnpm contracts:test          # forge tests
pnpm abi                     # regenerate packages/shared/src/abi from forge build output
pnpm --filter @sway/shared test
pnpm check                   # everything CI runs
```

## 6. Stack facts

- Next.js **16** (App Router, Turbopack). APIs differ from older Next: `params` is a Promise; use
  `PageProps<'/route'>` / `RouteContext<'/route'>`; `middleware.ts` is now `proxy.ts`. Bundled docs:
  `apps/web/node_modules/next/dist/docs/`.
- Tailwind v4 (`@theme` tokens in `globals.css`), lucide-react, viem 2, wagmi 2, Privy (`@privy-io/react-auth`, `@privy-io/wagmi`).
- Foundry + OpenZeppelin v5.4 (git submodules), solc 0.8.28.
- Arc testnet: chain 5042002, RPC `https://rpc.testnet.arc.io`, explorer `https://explorer.testnet.arc.io`,
  faucet `https://faucet.circle.com` (verified from docs.arc.io on 2026-11-18).

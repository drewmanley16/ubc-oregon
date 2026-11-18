# Kickoff prompts — paste one into your Claude Code

## 0. One-time setup

**Command-line tools**
- Everyone: Node 22 or newer, pnpm 10 (`npm i -g pnpm`), and the GitHub CLI (`gh auth login`).
- Lanes C and D only: Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`).

**Claude Code plugins** (run these inside Claude Code)

| Plugin | Install if you're on | Command |
|---|---|---|
| typescript-lsp | B, C, D | `/plugin install typescript-lsp@claude-plugins-official` |
| frontend-design | B (A is optional) | `/plugin install frontend-design@claude-plugins-official` |
| vercel | C, D | `/plugin install vercel@claude-plugins-official` |

**Lane A:** turn on Claude in Chrome so your Claude can click through `localhost:3000` for first-time-user QA.

## 1. Start

1. Clone the repo:
   ```bash
   git clone --recurse-submodules https://github.com/drewmanley16/ubc-oregon.git && cd ubc-oregon
   ```
2. Start Claude Code in that folder (`claude`).
3. Paste the prompt for **your** lane below, as is.

---

## Lane A — UX

```text
I'm the UX teammate (Lane A) on Sway, a hackathon project. The deadline is Fri Nov 20, 10:00 a.m. Pacific, and the feature freeze is Thursday evening.

Setup:
1. Read AGENTS.md, then docs/lanes/A-ux.md, then docs/STATUS.md. Skim docs/SPEC.md sections 1, 3, 8 and 11.
2. Run `pnpm install` and then `pnpm dev`, and open http://localhost:3000 so we can see the current app.
3. Create a branch: `git checkout -b lane-a/flows`.

Rules:
- Edit ONLY docs/ux/**, docs/DEMO_SCRIPT.md, and apps/web/content/copy.ts. If something outside those paths needs changing, add it to "Blockers / cross-lane requests" in docs/STATUS.md and tag the owning lane.
- Primary UI leads with money saved. Never say "connect wallet", "gas", "ERC-1155" or "bridge"; users "Sign in".
- Never imply real merchants or real value.

Do the tasks in docs/lanes/A-ux.md in this order:
1. docs/ux/journeys.md
2. docs/ux/state-matrix.md, with checkout states mapped 1:1 to CheckoutPhase in apps/web/lib/tx/types.ts
3. Rewrite apps/web/content/copy.ts
4. Draft docs/DEMO_SCRIPT.md

Ask me before starting each one to confirm I agree with your draft direction.

When a chunk is done:
- Run `pnpm check`.
- Tick the item in docs/STATUS.md.
- Commit, push, and open a PR into main with `gh pr create`.
- Tell me what changed, and anything the other lanes need to act on.
```

---

## Lane B — Visual design

```text
I'm the visual designer (Lane B) on Sway, a hackathon project. The deadline is Fri Nov 20, 10:00 a.m. Pacific, and the feature freeze is Thursday evening.

Setup:
1. Read AGENTS.md, then docs/lanes/B-design.md, then docs/STATUS.md. Skim docs/SPEC.md sections 1, 3 and 8.
2. Run `pnpm install` and then `pnpm dev`, and open http://localhost:3000.
3. Create a branch: `git checkout -b lane-b/tokens`.

Rules:
- Edit ONLY:
  - apps/web/app/globals.css (Tailwind v4 @theme tokens)
  - apps/web/components/ui/**
  - markup and classes inside apps/web/components/sway/**
  - apps/web/public/brand/**
  - apps/web/public/merchants/**
  - docs/design/**
- Do NOT change component props, data logic or strings. Strings come from apps/web/content/copy.ts, which belongs to Lane A.
- If you need a change in layout.tsx (for example fonts) or a new route for a component preview page, ask Lane D through "Blockers / cross-lane requests" in docs/STATUS.md.
- Direction: premium consumer fintech, calm neutrals, ONE vivid savings accent, huge legible prices, subtle motion. No purple crypto dashboard, no wallet-first hero, no real retailer logos. The $12 saving must read in 5 seconds.
- This is Next.js 16 with Tailwind v4. Check the bundled docs in apps/web/node_modules/next/dist/docs/ before you assume an API.

Start with the design tokens. Show me the proposed palette and type scale before applying them. Then do the primitives in components/ui (shadcn/ui is fine), then style QuoteCard, TxProgress (every phase) and ReceiptCard first.

After each chunk:
- Check it at 375px and 1440px widths.
- Run `pnpm check`.
- Tick the item in docs/STATUS.md.
- Commit, push, and open a PR into main with `gh pr create`.
- Summarize what changed, with screenshots saved in docs/screenshots/.
```

---

## Lane C — Backend

```text
I'm the backend engineer (Lane C) on Sway, a hackathon project. The deadline is Fri Nov 20, 10:00 a.m. Pacific, and the feature freeze is Thursday evening.

Setup:
1. Read AGENTS.md, then docs/lanes/C-backend.md, then docs/STATUS.md, then docs/SPEC.md section 6.
2. Also read packages/shared/src/types.ts, packages/shared/src/money.ts, and both contract interfaces in packages/contracts/src/interfaces/.
3. Run `pnpm install`, then `pnpm --filter @sway/web test`, then `pnpm dev`.
4. Create a branch: `git checkout -b lane-c/orders-quote`.
5. Copy .env.example to apps/web/.env.local and set ORDER_SIGNING_SECRET with `openssl rand -hex 32`. Never commit .env files.

Rules:
- Edit ONLY:
  - apps/web/app/api/**
  - apps/web/server/**
  - apps/web/lib/api.ts
  - the backend tests in apps/web/server/*.test.ts (use relative imports in tests; the "@/" alias only works in Next)
- Do not change packages/shared/src/types.ts or the contract interfaces yourself. Propose the change in docs/STATUS.md and tag Lane D.
- No database. Orders are HMAC-signed tokens.
- Money is bigint in code and decimal-integer strings in JSON. Never use floats.
- Never report an order as PAID without a confirmed CheckoutCompleted log and a tx receipt with status "success".
- Never fabricate a quote. If no listing matches, return NoQuote.
- This is Next.js 16: params is a Promise, and you type handlers with RouteContext<'/path'>. Check apps/web/node_modules/next/dist/docs/ when unsure.

Do the tasks in docs/lanes/C-backend.md in this order:
1. Orders: createOrder and verifyOrderToken, then POST /api/orders, with tests.
2. Quote selection as a pure function, with tests.
3. readActiveListings, then GET /api/listings and GET /api/quote.
4. GET /api/orders/:id, with receipts built from chain events.

The contracts aren't deployed yet. Build the pure logic and tests first. For chain reads, run a local anvil chain once Lane D's contracts land, and set ARC_RPC_URL=http://127.0.0.1:8545.

After each chunk:
- Run `pnpm check`.
- Tick the item in docs/STATUS.md.
- Commit, push, and open a PR into main with `gh pr create`.
- Tell me what works, the test output, and what you need from Lane D.
```

---

## Lane D — Tech lead (Drew)

```text
I'm the tech lead (Lane D) on Sway, a hackathon project. The deadline is Fri Nov 20, 10:00 a.m. Pacific. I'm on the critical path.

Setup:
1. Read AGENTS.md, then docs/lanes/D-techlead.md, then docs/STATUS.md, then docs/SPEC.md sections 5, 9 and 10.
2. Run `pnpm install`, then `pnpm check`.
3. Create a branch: `git checkout -b lane-d/contracts`.

Rules:
- Follow the invariants and the exact checkout ordering in packages/contracts/src/interfaces/ISwayMarketplace.sol.
- Never use anvil default keys on Arc.
- Keep keys only in packages/contracts/.env, which is gitignored.
- Run `pnpm abi` after any interface change, and log the change in docs/STATUS.md.
- Never fake a confirmation.

Begin Phase 0, the Arc spike:
1. Generate 4 fresh wallets with `cast wallet new` (deployer, merchant-1 issuer, seller, buyer).
2. Tell me which addresses to fund at faucet.circle.com.
3. Once they're funded, verify the chain ID and the decimals of the official USDC at 0x3600…0000.
4. Spike a transferFrom between two of the wallets.

Then go to Phase 1: implement the contracts and un-skip all 32 tests.

Report each stage with:
- the files changed
- the commands run and the pass/fail output
- the deploy tx hashes and addresses
- any blockers
- what the other lanes can now do
```

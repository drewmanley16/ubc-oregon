# Lane A — UX (flows, states, microcopy, first-time-user QA)

Read: `AGENTS.md`, spec §1, §3, §8 "Member A", §11 (pitch — the demo is a UX artifact).
**Acceptance:** a judge understands the savings proposition in 5 seconds and completes checkout with minimal coaching.

## Owns
`docs/ux/**` · `apps/web/content/copy.ts` (**every** user-facing string).

## Don't touch
Code outside `content/copy.ts`. If a screen needs a new string, add a key to `copy.ts` and leave a
`TODO(lane-D): use copy.x.y` note in `docs/STATUS.md`. Need a new UI state? Propose it in `docs/ux/state-matrix.md` and ping lane D (it changes `lib/tx/types.ts`).

## Tasks
- [ ] `docs/ux/journeys.md` — three role journeys (buyer = primary, seller, merchant), step by step, with the screen and the on-chain action at each step.
- [ ] `docs/ux/state-matrix.md` — for each screen (landing, store, checkout, receipt, sell, merchant): empty, loading, no offer, quote available, quote stale, signed out, wrong network, insufficient funds, needs approval, approving, awaiting signature, pending, confirmed, rejected, failed. Map checkout states 1:1 to `CheckoutPhase` in `apps/web/lib/tx/types.ts`.
- [ ] Flow handoff: clickable Figma or annotated wireframes linked from `docs/ux/README.md`.
- [ ] Rewrite/expand `content/copy.ts` — quote, checkout CTA per state, sign-in (Privy email/Google; say "Sign in", never "connect wallet" in primary UI), approval explanation in plain language ("Enable payment" = ERC-20 approve), errors with a next action, receipt, demo disclaimer.
- [ ] Friction pass: count taps from landing → receipt. Target ≤ 5 for a returning user. Identify what can be removed.
- [ ] First-time-user test on the running app (desktop + phone). Log blockers in `docs/ux/qa-log.md` with screenshots; tag the lane that owns the fix.
- [ ] Draft the 2–3 min demo video script in `docs/DEMO_SCRIPT.md` with lane D.

## Rules for copy
Lead with money saved. No jargon in primary UI (no "ERC-1155", "gas", "bridge", "wallet address"). Never imply real merchants or real value. Errors say what happened + that the user wasn't charged (only if true) + what to do.

## Done when
Someone who's never seen Sway completes the buyer flow on the deployed site without asking a question.

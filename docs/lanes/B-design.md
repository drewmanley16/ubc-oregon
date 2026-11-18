# Lane B — Visual design (brand, tokens, components, responsive polish)

Read: `AGENTS.md`, spec §1 (pitch), §3 (screens), §8 "Member B".
**Deliver in code, not just Figma.** Figma is for exploration; the source of truth is the running app.

## Direction (from spec)
Premium consumer fintech. Calm neutrals + **one** vivid savings accent. Huge, legible prices. Subtle motion.
**Avoid:** purple crypto-dashboard look, wallet-first hero, real retailer logos.
The $12 savings must be understood in **5 seconds**.

## Owns
`apps/web/app/globals.css` (Tailwind v4 `@theme` tokens) · `apps/web/components/ui/**` (primitives) ·
markup/classes inside `apps/web/components/sway/**` · `apps/web/public/brand/**` (logo SVG, favicon) ·
`apps/web/public/merchants/**` (original merchant art) · `docs/design/**` (Figma links, token notes).

## Don't touch
Component **props** without lane D sign-off (they're the data contract) · data fetching/wallet logic · strings (use `copy` from `content/copy.ts`; ask lane A for new ones).

## Tasks
- [ ] Tokens in `globals.css` `@theme`: color (ink, paper, muted, border, savings accent, danger, warning), type scale incl. display price size, spacing, radii, shadows, motion durations. Light mode required; dark optional.
- [ ] Fonts via `next/font` (coordinate: lane D owns `layout.tsx` — send a snippet or small PR).
- [ ] Primitives in `components/ui`: Button (primary/secondary/ghost, loading, disabled), Card, Badge, Skeleton, Sheet/Dialog, Toast. shadcn/ui is fine (`pnpm dlx shadcn@latest init` in `apps/web`).
- [ ] Style product components in `components/sway/`: `Price`, `MerchantCard`, `ProductCard`, `OrderSummary`, `QuoteCard` (hero), `TxProgress` (**every** phase in `lib/tx/types.ts`), `ReceiptCard`, `DemoBanner`.
- [ ] Brand: Sway SVG logo + favicon in `public/brand/`. Original illustrations/photos for Daybreak Coffee, Northline Apparel, Parkside Market in `public/merchants/<slug>.(svg|webp)` (set `imageUrl` via lane C's seed).
- [ ] Responsive: 375px mobile and 1440px desktop for landing, store, checkout, receipt, sell.
- [ ] Accessibility: WCAG AA contrast, visible focus, `prefers-reduced-motion`.
- [ ] Design QA against running app (`pnpm dev`) — file issues/TODOs with screenshots in `docs/screenshots/`.

## Working before the real data exists
Every component renders from typed props — build a scratch page with fixtures (e.g. `app/dev/components/page.tsx`, coordinate the route with D), or pass hard-coded fixtures matching `packages/shared/src/types.ts`.

## Done when
Checkout + receipt look finished on mobile and desktop with real data, and the savings figure is the first thing your eye lands on.

# Sway — gift cards that can't be drained

> **A $100 gift card for $88. Or cash for the card you'll never use.**

Gift card resale has one big scam: the seller keeps the number and spends the card after you've paid.
Sway fixes it with a **swap**: when a card is listed, its balance moves onto a brand-new card number only Sway
knows, so the seller's copy is instantly worth $0. The buyer pays USDC on **Arc testnet** and in **one atomic
transaction** the seller is paid, Sway takes its fee, and the buyer's claim is settled. Only the buyer's
wallet can then reveal the new number + PIN.

**Live demo:** https://sway-ubc.vercel.app

UBC 2026 Hackathon · Track: **Consumer Applications** · Chain award: **Best Use of Arc**

> ⚠️ Hackathon prototype. All merchants and credit are fictional with no real-world value. Testnet only.
> See [docs/SECURITY_AND_LIMITATIONS.md](docs/SECURITY_AND_LIMITATIONS.md).

**Status: skeleton — implementation in progress.** See [docs/STATUS.md](docs/STATUS.md).

## Team & contributing
**New teammate?** Paste your lane's prompt from [KICKOFF.md](KICKOFF.md) into Claude Code.
Every teammate (and their coding agent) starts at **[AGENTS.md](AGENTS.md)** → their lane file in [`docs/lanes/`](docs/lanes/).

## How it works
1. **Sell.** A seller enters a gift card number + PIN. Sway checks the balance with the store and **swaps** the
   value onto a new card held in Sway's vault — the old number now shows $0.
2. Sway mints on-chain credit 1:1 for the vaulted value (ERC-1155, 1 unit = $0.01) to the seller, tops up their
   network fee, and the seller lists it from their own account (escrowed on-chain at the store's fixed rate).
3. **Buy.** A shopper signs in with email and buys the $100 card for 88 USDC.
4. One transaction: 85 USDC → seller, 3 USDC → Sway, credit burned, `CheckoutCompleted` emitted.
5. **Reveal.** The buyer signs a free message; the server checks the chain receipt + signature and shows the
   new card number + PIN (balance $100).

> The stores' gift-card system is **simulated** for the demo (fictional stores, `7777…` card numbers). In
> production the swap goes through a retailer or exchange-partner API. Everything involving money is real on Arc.

## Business model
Sway sets per-store rates as a % of face value. Demo rates: **buyer pays 88%, seller receives 85%,
Sway keeps the 3% spread.** Rates are locked into each listing when it's created and enforced on-chain;
the buyer's price never includes hidden fees ("a $100 gift card for $88").

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Full spec: [docs/SPEC.md](docs/SPEC.md)

## Repo layout
```
apps/web/                 Next.js 16 app — pages, API route handlers (backend), components
packages/contracts/       Foundry — MerchantCredit, SwayMarketplace, MockUSDC (fallback), scripts, tests
packages/shared/          TS types, verified Arc chain config, integer money helpers, generated ABIs
docs/                     spec, lanes, status, architecture, security, demo script
```

## Quickstart
Prereqs: Node 22+, pnpm 10, Foundry.
```bash
git clone --recurse-submodules https://github.com/drewmanley16/ubc-oregon.git && cd ubc-oregon
pnpm install
cp .env.example apps/web/.env.local          # fill NEXT_PUBLIC_PRIVY_APP_ID, ORDER_SIGNING_SECRET
cp .env.example packages/contracts/.env      # fill keys (cast wallet new) — never commit
pnpm check                                   # tests + typecheck + build
pnpm dev                                     # http://localhost:3000
```
Deploy (listings then come from the /sell flow — don't run SeedDemo on Arc, its credit has no vaulted card behind it):
```bash
cd packages/contracts && set -a && source .env && set +a
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## Deployed on Arc testnet
| Contract | Address |
|---|---|
| MerchantCredit | [`0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64`](https://explorer.testnet.arc.io/address/0x7Bc4952F41f6B2A0be5b27f8479786A480a18f64) |
| SwayMarketplace | [`0xbA5b1c1621a815E1C254188374191C1AAFdb9f90`](https://explorer.testnet.arc.io/address/0xbA5b1c1621a815E1C254188374191C1AAFdb9f90) |
| USDC (official) | [`0x3600000000000000000000000000000000000000`](https://explorer.testnet.arc.io/address/0x3600000000000000000000000000000000000000) |

## Network (verified from [docs.arc.io](https://docs.arc.io/arc/references/connect-to-arc.md), 2026-11-18)
| | Arc testnet |
|---|---|
| Chain ID | 5042002 |
| RPC | https://rpc.testnet.arc.io |
| Explorer | https://explorer.testnet.arc.io |
| Faucet | https://faucet.circle.com |
| Gas token | USDC (native, 18-decimal view) |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` (6 decimals, same balance as gas) |

## Deployments
_Pending — see [docs/STATUS.md](docs/STATUS.md#deployments)._

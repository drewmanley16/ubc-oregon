# Sway — smart checkout for discounted merchant credit

> **Your $100 order costs $88. Save $12 with Sway.**

Sway buys discounted, merchant-issued store credit from people who'd rather have cash, and applies it to
your checkout in **one atomic on-chain transaction** on **Arc testnet**: the seller is paid in USDC and the
merchant credit is burned together, or not at all.

UBC 2026 Hackathon · Track: **Consumer Applications** · Chain award: **Best Use of Arc**

> ⚠️ Hackathon prototype. All merchants and credit are fictional with no real-world value. Testnet only.
> See [docs/SECURITY_AND_LIMITATIONS.md](docs/SECURITY_AND_LIMITATIONS.md).

**Status: skeleton — implementation in progress.** See [docs/STATUS.md](docs/STATUS.md).

## Team & contributing
**New teammate?** Paste your lane's prompt from [KICKOFF.md](KICKOFF.md) into Claude Code.
Every teammate (and their coding agent) starts at **[AGENTS.md](AGENTS.md)** → their lane file in [`docs/lanes/`](docs/lanes/).

## How it works
1. A (fictional) merchant issues $100 of on-chain credit (ERC-1155, 1 unit = $0.01) to a customer.
2. That customer lists the credit for 88 USDC; the credit moves into marketplace escrow.
3. A shopper with a $100 cart gets a quote, approves 88 USDC, and confirms checkout.
4. One transaction: 88 USDC → seller, $100 credit burned, `CheckoutCompleted` emitted as the merchant's receipt.

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
Deploy + seed (once implemented):
```bash
cd packages/contracts && source .env
forge script script/Deploy.s.sol   --rpc-url arc_testnet --broadcast
forge script script/SeedDemo.s.sol --rpc-url arc_testnet --broadcast
cd ../.. && pnpm abi
```

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

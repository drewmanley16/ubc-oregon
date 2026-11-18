import { defineChain } from "viem";

// Verified 2026-11-18 from https://docs.arc.io/arc/references/connect-to-arc.md
// and https://docs.arc.io/arc/references/contract-addresses.md
export const ARC_TESTNET_CHAIN_ID = 5042002;

/** Official Arc testnet USDC ERC-20 interface. 6 decimals. SAME balance as native gas (18dp view). */
export const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000" as const;
export const ARC_TESTNET_USDC_DECIMALS = 6;

/** Blocklisted on Arc testnet — anvil/hardhat default account #1. Never use the default mnemonic on Arc. */
export const ARC_BLOCKLISTED_TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  // Native gas is USDC with 18 decimals. Do NOT use this for token accounting — use the ERC-20 (6dp).
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"], webSocket: ["wss://rpc.testnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.testnet.arc.io" },
  },
  testnet: true,
});

export const explorerTxUrl = (hash: string) => `${arcTestnet.blockExplorers.default.url}/tx/${hash}`;
export const explorerAddressUrl = (addr: string) => `${arcTestnet.blockExplorers.default.url}/address/${addr}`;

"use client";
// LANE D. The only wallet surface pages/components use (see ./types.ts).
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { ARC_TESTNET_CHAIN_ID, type Address } from "@sway/shared";
import { privyEnabled } from "./config";
import type { SwayWallet } from "./types";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function usePrivySwayWallet(): SwayWallet {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { address, chainId } = useAccount();
  const active = wallets.find((w) => w.address.toLowerCase() === address?.toLowerCase()) ?? wallets[0];

  if (!ready) return { status: "loading", onArc: false, signIn: () => {}, signOut: () => {}, switchToArc: async () => {} };
  const addr = (address ?? active?.address) as Address | undefined;
  return {
    status: authenticated && addr ? "signed-in" : authenticated ? "loading" : "signed-out",
    address: addr,
    label: user?.email?.address ?? user?.google?.email ?? (addr ? short(addr) : undefined),
    onArc: chainId === ARC_TESTNET_CHAIN_ID,
    signIn: () => login(),
    signOut: () => void logout(),
    switchToArc: async () => {
      await active?.switchChain(ARC_TESTNET_CHAIN_ID);
    },
  };
}

function useDisabledSwayWallet(): SwayWallet {
  return {
    status: "signed-out",
    onArc: false,
    signIn: () => alertMissingConfig(),
    signOut: () => {},
    switchToArc: async () => {},
  };
}

function alertMissingConfig() {
  console.error("Sign-in disabled: set NEXT_PUBLIC_PRIVY_APP_ID (see .env.example).");
}

// privyEnabled is a build-time constant, so hook order is stable.
export const useSwayWallet: () => SwayWallet = privyEnabled ? usePrivySwayWallet : useDisabledSwayWallet;

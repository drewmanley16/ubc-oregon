"use client";
// LANE D. PLACEHOLDER implementation so lanes A/B can build screens before Privy is wired.
// TODO(lane-D): implement with @privy-io/react-auth (usePrivy, useWallets) + @privy-io/wagmi.
//   - PrivyProvider config: defaultChain/supportedChains = [arcTestnet], embeddedWallets.ethereum.createOnLogin = "users-without-wallets",
//     loginMethods: ["email","google","passkey","wallet"].
import type { SwayWallet } from "./types";

export function useSwayWallet(): SwayWallet {
  return {
    status: "signed-out",
    onArc: false,
    signIn: () => console.warn("TODO(lane-D): Privy signIn"),
    signOut: () => {},
    switchToArc: async () => {},
  };
}

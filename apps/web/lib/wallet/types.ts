// LANE D owns. The ONLY wallet surface pages/components may use. Swap implementations behind it.
// Product rule (spec §1, §3): wallet is secondary UI. Users "Sign in", they don't "connect a wallet".
import type { Address } from "@sway/shared";

export type SwayWallet = {
  status: "loading" | "signed-out" | "signed-in";
  address?: Address;
  /** Display label, e.g. user's email from Privy, else a shortened address. */
  label?: string;
  /** true when the active wallet is on Arc testnet. */
  onArc: boolean;
  signIn: () => void; // Privy: email / Google / passkey; external wallets as secondary option
  signOut: () => void;
  switchToArc: () => Promise<void>;
};

"use client";
// LANE B styles; LANE D owns behavior. Compact, secondary placement only (spec §3: wallet not the hero).
import type { SwayWallet } from "@/lib/wallet/types";

export function AccountChip({ wallet }: { wallet: SwayWallet }) {
  if (wallet.status === "loading") return <span className="text-xs opacity-60">…</span>;
  if (wallet.status === "signed-out")
    return <button onClick={wallet.signIn} className="rounded-full border px-3 py-1 text-sm">Sign in</button>;
  return (
    <button onClick={wallet.signOut} className="rounded-full border px-3 py-1 text-xs" title={wallet.address}>
      {wallet.label} · Sign out
    </button>
  );
}

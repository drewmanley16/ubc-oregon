"use client";
// LANE B styles; LANE D owns behavior. Compact, secondary placement only (spec §3: wallet not the hero).
import type { SwayWallet } from "@/lib/wallet/types";
import { copy } from "@/content/copy";

export function AccountChip({ wallet }: { wallet: SwayWallet }) {
  if (wallet.status === "loading") return <span className="chip">…</span>;
  if (wallet.status === "signed-out")
    return (
      <button onClick={wallet.signIn} className="chip" style={{ cursor: "pointer" }}>
        {copy.account.signIn}
      </button>
    );
  return (
    <button onClick={wallet.signOut} className="chip" title={`${wallet.address} · ${copy.account.signOut}`} style={{ cursor: "pointer" }}>
      {wallet.label}
    </button>
  );
}

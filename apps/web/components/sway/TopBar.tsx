"use client";
// Logo + optional back link + compact account chip (wallet stays secondary, spec §3).
import Link from "next/link";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { AccountChip } from "./AccountChip";
import { Icon } from "./Icon";

export function TopBar({ back, chip }: { back?: string; chip?: string }) {
  const wallet = useSwayWallet();
  return (
    <div className="topbar">
      {back ? (
        <Link href={back} className="back" style={{ textDecoration: "none" }}>
          <Icon name="left" />
          Back
        </Link>
      ) : (
        <Link href="/" className="logo">
          Sway
        </Link>
      )}
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {chip && <span className="chip">{chip}</span>}
        <AccountChip wallet={wallet} />
      </span>
    </div>
  );
}

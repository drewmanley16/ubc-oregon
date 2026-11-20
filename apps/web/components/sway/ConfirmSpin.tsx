"use client";
// LANE B. Payment-confirmed moment: the gift card spins, settles, then "Transaction accepted" + Arcscan link.
// Mount ONLY with a chain-confirmed receipt (order state PAID). Never show it optimistically (AGENTS.md rule 1).
// Plays once per order per tab (sessionStorage); reload goes straight to the receipt.
import { useEffect, useRef, useState } from "react";
import type { Merchant } from "@sway/shared";
import { GiftCard } from "./GiftCard";
import { Icon } from "./Icon";
import { copy } from "@/content/copy";

// Arcscan (Blockscout) for Arc testnet; same data as chain.ts's explorer.testnet.arc.io, verified Nov 20.
const ARCSCAN_TX = (hash: string) => `https://testnet.arcscan.app/tx/${hash}`;
const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

export function ConfirmSpin({ orderId, merchant, valueCents, txHash }: { orderId: string; merchant: Merchant; valueCents: string; txHash: string }) {
  const key = `sway:confirmed:${orderId}`;
  // Mounts only after the client-side order fetch returns PAID (never during SSR), so reading storage here is safe.
  const [open, setOpen] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(key) !== "1";
    } catch {
      return true;
    }
  });
  const [closing, setClosing] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  // Under prefers-reduced-motion globals.css disables animations, so animationend never fires: close at once.
  const close = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? setOpen(false) : setClosing(true));

  useEffect(() => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => btn.current?.focus({ preventScroll: true }), 1500);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className={`confirm${closing ? " closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onAnimationEnd={(e) => closing && e.target === e.currentTarget && setOpen(false)}
    >
      <div className="confirm-stage" aria-hidden="true">
        <div className="confirm-spin">
          <GiftCard merchant={merchant} valueCents={valueCents} />
        </div>
        <span className="confirm-glow" />
      </div>
      <div className="confirm-text">
        <span className="badge">
          <Icon name="check" />
        </span>
        <h2 id="confirm-title">{copy.receipt.accepted}</h2>
        <a className="confirm-link" href={ARCSCAN_TX(txHash)} target="_blank" rel="noreferrer">
          {copy.receipt.viewOnArcscan}
          <span className="hash">{short(txHash)}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <button ref={btn} className="cta confirm-go" onClick={close}>
        <span>{copy.receipt.continue}</span>
      </button>
    </div>
  );
}

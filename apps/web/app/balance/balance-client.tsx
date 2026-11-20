"use client";
import { useState } from "react";
import { formatCents } from "@sway/shared";
import { giftcards, type CardBalance } from "@/lib/api";
import { groupCardNumber } from "@/lib/format";
import { copy } from "@/content/copy";

export function BalanceClient() {
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<CardBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setError(null);
    setRes(null);
    try {
      setRes(await giftcards.balance(number, pin));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void check();
      }}
    >
      <h1 className="text-2xl font-semibold">{copy.balance.title}</h1>
      <p className="text-sm opacity-70">{copy.balance.sub}</p>
      <input value={number} onChange={(e) => setNumber(groupCardNumber(e.target.value))} placeholder={copy.card.number} className="rounded border p-2 font-mono" inputMode="numeric" required />
      <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder={copy.card.pin} className="rounded border p-2 font-mono" inputMode="numeric" required />
      <button className="rounded bg-black px-5 py-3 text-white">{copy.balance.check}</button>
      {res && (
        <div aria-live="polite" className="rounded border p-3">
          <div className="text-3xl font-semibold">{formatCents(res.balanceCents)}</div>
          <div className="text-sm opacity-70">•••• {res.last4}</div>
          {res.status === "SWAPPED_OUT" && <p className="mt-1">{copy.balance.swappedOut}</p>}
        </div>
      )}
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </form>
  );
}

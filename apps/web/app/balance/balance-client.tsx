"use client";
import { useState } from "react";
import { formatCents } from "@sway/shared";
import { giftcards, type CardBalance } from "@/lib/api";
import { getMerchantById } from "@/lib/merchants";
import { groupCardNumber } from "@/lib/format";
import { TopBar } from "@/components/sway/TopBar";
import { Icon } from "@/components/sway/Icon";
import { copy } from "@/content/copy";

export function BalanceClient() {
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<CardBalance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setBusy(true);
    setError(null);
    setRes(null);
    try {
      setRes(await giftcards.balance(number, pin));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scroll fresh">
        <TopBar back="/" />
        <div className="pad">
          <h1 className="h-page">{copy.balance.title}</h1>
          <p className="sub">{copy.balance.sub}</p>
        </div>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
        >
          <label className="field">
            {copy.card.number}
            <input className="mono" inputMode="numeric" autoComplete="off" placeholder="7777 0000 0000 0000" value={number} onChange={(e) => setNumber(groupCardNumber(e.target.value))} />
          </label>
          <label className="field">
            {copy.card.pin}
            <input className="mono" inputMode="numeric" autoComplete="off" placeholder="6 digits" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          <button type="submit" hidden />
        </form>
        {res && (
          <div className="pad" style={{ marginTop: 18, display: "grid", gap: 12 }} aria-live="polite">
            <div className="record">
              <div>
                <span>Card</span>
                <span>
                  {getMerchantById(res.merchantId)?.name} ···· {res.last4}
                </span>
              </div>
              <div>
                <span>{copy.card.balance}</span>
                <span>{formatCents(res.balanceCents)}</span>
              </div>
            </div>
            {res.status === "SWAPPED_OUT" && (
              <div className="note good" style={{ margin: 0 }}>
                <b>
                  <Icon name="check" />
                  This card was sold on Sway
                </b>
                <p>{copy.balance.swappedOut}</p>
              </div>
            )}
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <div className="dock">
        <button className="cta" onClick={() => void check()} disabled={busy || number.replace(/\D/g, "").length < 12 || !pin}>
          <span>
            {busy && <i className="spin" />}
            {copy.balance.check}
          </span>
        </button>
      </div>
    </>
  );
}

"use client";
// LANE B styles (prototype "gcard" + "flip"). The one object both buyer and seller care about.
import { useState, type CSSProperties } from "react";
import { formatCents, type Merchant } from "@sway/shared";
import { brandOf } from "@/lib/brand";
import { groupCardNumber } from "@/lib/format";
import { copy } from "@/content/copy";

const vars = (m: Merchant) => {
  const b = brandOf(m.id);
  return { "--c1": b.c1, "--c2": b.c2 } as CSSProperties;
};

/** Front cover: store, value, no number. */
export function GiftCard({ merchant, valueCents = "10000", className = "" }: { merchant: Merchant; valueCents?: string; className?: string }) {
  return (
    <div className={`gcard ${className}`} style={vars(merchant)}>
      <span className="wm" aria-hidden="true">{merchant.name[0]}</span>
      <div className="top">
        <span>{merchant.name}</span>
        <small>eGift card</small>
      </div>
      <div className="mid">{brandOf(merchant.id).gift}</div>
      <div className="bottom">
        <span className="val">{formatCents(valueCents).replace(".00", "")}</span>
        <small>Use in store or online</small>
      </div>
    </div>
  );
}

/** Two-sided card: tap to turn it over and see number + PIN. Starts on the back right after reveal. */
export function FlipCard({ merchant, number, pin, balanceCents }: { merchant: Merchant; number: string; pin: string; balanceCents: string }) {
  const [flipped, setFlipped] = useState(true);
  const [lifting, setLifting] = useState(true);
  const turn = () => {
    setLifting(true);
    setFlipped((f) => !f);
  };
  return (
    <div
      className={`flip${flipped ? " flipped" : ""}${lifting ? " lifting" : ""}`}
      role="button"
      tabIndex={0}
      onClick={turn}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), turn())}
      onAnimationEnd={() => setLifting(false)}
      aria-label={flipped ? "Gift card, back: number and PIN. Tap to see the front." : "Gift card, front. Tap to see the number and PIN."}
    >
      <div className="flip-inner">
        <div className="face front" aria-hidden={flipped}>
          <GiftCard merchant={merchant} valueCents={balanceCents} />
        </div>
        <div className="gcard face back" style={vars(merchant)} aria-hidden={!flipped}>
          <div className="stripe" />
          <div className="panel">
            <div>
              <small>{copy.card.number}</small>
              <b>{groupCardNumber(number)}</b>
            </div>
            <div className="two">
              <div>
                <small>{copy.card.pin}</small>
                <b>{pin}</b>
              </div>
              <div>
                <small>{copy.card.balance}</small>
                <b>{formatCents(balanceCents)}</b>
              </div>
            </div>
          </div>
          <div className="bkfoot">
            <span>{merchant.name}</span>
            <span>Tap to flip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

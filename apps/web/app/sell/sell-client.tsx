"use client";
// LANE D (prototype seller screens). sign in -> card number + PIN -> POST /api/sell (verify, swap, mint, gas)
// -> list (wallet txs). Nothing is shown as "listed" until createListing's receipt succeeds.
import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { explorerTxUrl, formatCents, getDeployment, swayMarketplaceAbi, usdcUnitsToCentsExact, type Merchant } from "@sway/shared";
import { giftcards, type DemoCard, type Sale } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { useListCredit } from "@/lib/tx/use-list-credit";
import { TopBar } from "@/components/sway/TopBar";
import { GiftCard } from "@/components/sway/GiftCard";
import { Mark } from "@/components/sway/Mark";
import { Icon } from "@/components/sway/Icon";
import { groupCardNumber } from "@/lib/format";
import { copy } from "@/content/copy";
import { DEMO_FACE_CENTS } from "@/lib/demo";

const deployment = getDeployment();
const FACE = DEMO_FACE_CENTS;
const whole = (c: bigint | string) => formatCents(c).replace(".00", "");

export function SellClient({ merchants }: { merchants: Merchant[] }) {
  const wallet = useSwayWallet();
  const [merchantId, setMerchantId] = useState(merchants[0].id);
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [demo, setDemo] = useState<DemoCard | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: listState, list } = useListCredit(deployment, wallet);
  const merchant = merchants.find((m) => m.id === merchantId)!;

  const preview = useReadContract({
    address: deployment?.marketplace,
    abi: swayMarketplaceAbi,
    functionName: "previewPrice",
    args: [BigInt(merchantId), FACE],
    query: { enabled: !!deployment },
  });
  const dec = deployment?.usdcDecimals ?? 6;
  const askCents = preview.data ? usdcUnitsToCentsExact(preview.data[0], dec) : null;
  const payoutCents = preview.data ? usdcUnitsToCentsExact(preview.data[1], dec) : null;
  const feeCents = preview.data ? usdcUnitsToCentsExact(preview.data[2], dec) : null;
  const ready = number.replace(/\D/g, "").length >= 12 && /^\d{4,8}$/.test(pin.trim());

  async function getDemoCard() {
    setError(null);
    try {
      const c = await giftcards.demoCard(merchantId);
      setDemo(c);
      setNumber(groupCardNumber(c.number));
      setPin(c.pin);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit() {
    if (checking || !wallet.address) return;
    setChecking(true);
    setError(null);
    try {
      const s = await giftcards.sell({ merchantId, number, pin, seller: wallet.address });
      setSale(s);
      await list(s.merchantId, BigInt(s.faceCents));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  // ── listed ──
  if (sale && listState.phase === "listed")
    return (
      <>
        <div className="scroll fresh">
          <TopBar />
          <div className="pad">
            <h1 className="h-page">Listed.</h1>
            <p className="sub">{payoutCents !== null ? `You'll be paid ${whole(payoutCents)} automatically when someone buys it.` : copy.sell.listed}</p>
          </div>
          <div className="items" style={{ marginTop: 22 }}>
            <div className="credit-row">
              <Mark merchant={merchant} />
              <span className="t">
                <b>{whole(sale.faceCents)} {merchant.name} gift card</b>
                <small>
                  <i className="status-dot" />
                  Waiting for a buyer{payoutCents !== null ? ` · you get ${whole(payoutCents)}` : ""}
                </small>
              </span>
            </div>
          </div>
          <div className="note good">
            <b>
              <Icon name="check" />
              Your old card is now $0
            </b>
            <p>Its balance moved to a new number only Sway holds, so nobody can spend it twice.</p>
          </div>
          <div className="pad" style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <Link className="textlink" href="/balance">
              {copy.sell.checkOld}
            </Link>
            <a className="textlink" href={explorerTxUrl(listState.txHash)} target="_blank" rel="noreferrer">
              {copy.sell.mintTx}
            </a>
          </div>
          <div className="footer-note">Payments are recorded on Arc, a public ledger.</div>
        </div>
        <div className="dock">
          <button
            className="cta ghost"
            onClick={() => {
              setSale(null);
              setNumber("");
              setPin("");
              setDemo(null);
              window.location.reload();
            }}
          >
            <span>Sell another card</span>
          </button>
        </div>
      </>
    );

  // ── checking (verify + swap on server, then list from wallet) ──
  if (checking || sale) {
    const stage = !sale ? 0 : listState.phase === "approving" || listState.phase === "listing" || listState.phase === "idle" ? 2 : 2;
    const steps: [string, string, string][] = [
      ["Checking your card with the shop", copy.sell.verified(whole(sale?.faceCents ?? FACE)), ""],
      ["Moving it to a new card number", "Moved to a new card number", sale ? `Your card ending ${sale.oldLast4} is now $0, so it can't be spent twice.` : ""],
      ["Listing your card", "Listed", sale?.gasTx ? copy.sell.gasCovered : ""],
    ];
    const stuck = !!sale && (listState.phase === "rejected" || listState.phase === "failed");
    return (
      <>
        <div className="scroll fresh">
          <TopBar />
          <div className="pad">
            <h1 className="h-page">Checking your card</h1>
            <p className="sub">This takes a few seconds. Keep this screen open.</p>
          </div>
          <div className="steps">
            {steps.map(([doing, done, note], i) => {
              const state = i < stage ? "done" : i === stage && !stuck ? "active" : i === stage ? "wait" : "wait";
              return (
                <div key={i} className={`stp ${state}${state === "done" ? " just" : ""}`}>
                  <span className="dot">{state === "done" && <Icon name="check" />}</span>
                  <span className="txt">
                    <b>{state === "done" ? done : doing}</b>
                    {state === "done" && note && <small>{note}</small>}
                  </span>
                </div>
              );
            })}
          </div>
          {listState.phase === "rejected" && (
            <div className="note calm">
              <b>
                <Icon name="info" />
                Not listed yet
              </b>
              <p>{copy.sell.rejected}</p>
            </div>
          )}
          {listState.phase === "failed" && (
            <div className="note alert" role="alert">
              <b>
                <Icon name="alert" />
                Couldn&apos;t list it
              </b>
              <p>{listState.message}</p>
            </div>
          )}
          {error && <p className="err" role="alert">{error}</p>}
        </div>
        <div className="dock">
          {stuck && sale ? (
            <button className="cta" onClick={() => void list(sale.merchantId, BigInt(sale.faceCents))}>
              <span>{copy.sell.retryList}</span>
            </button>
          ) : (
            <button className="cta" disabled>
              <span>
                <i className="spin" />
                {!sale ? copy.sell.verifying : listState.phase === "approving" ? copy.sell.approving : copy.sell.listing}
              </span>
            </button>
          )}
        </div>
      </>
    );
  }

  // ── signed out: seller home ──
  if (wallet.status !== "signed-in")
    return (
      <>
        <div className="scroll fresh">
          <TopBar />
          <div className="pad">
            <h1 className="h-land">Turn gift cards into cash.</h1>
            <p className="sub">{copy.sell.sub}</p>
          </div>
          <div className="gwrap" style={{ marginTop: 22 }}>
            <GiftCard merchant={merchant} />
          </div>
          <div className="note">
            <b>
              <Icon name="lock" />
              Nobody can spend it twice
            </b>
            <p>Sway moves your card&apos;s balance to a new number only Sway holds. Your old number drops to $0.</p>
          </div>
        </div>
        <div className="dock">
          <button className="cta" onClick={wallet.signIn}>
            <span>{copy.sell.signIn}</span>
          </button>
        </div>
      </>
    );

  // ── enter the card ──
  return (
    <>
      <div className="scroll fresh">
        <TopBar />
        <div className="pad">
          <h1 className="h-page">{copy.sell.title}</h1>
          <p className="sub">{copy.sell.sub}</p>
        </div>
        <div className="payout">
          <div className="lbl">You get when it sells</div>
          <div className="now green">{payoutCents !== null ? whole(payoutCents) : "—"}</div>
        </div>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="field">
            {copy.sell.store}
            <select value={merchantId} onChange={(e) => setMerchantId(Number(e.target.value))}>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {copy.sell.number}
            <input className="mono" inputMode="numeric" autoComplete="off" placeholder="7777 0000 0000 0000" value={number} onChange={(e) => setNumber(groupCardNumber(e.target.value))} />
          </label>
          <label className="field">
            {copy.sell.pin}
            <input className="mono" inputMode="numeric" autoComplete="off" placeholder="6 digits" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          <div className="demo-line">
            {copy.sell.noCard}{" "}
            <button type="button" className="textlink" onClick={() => void getDemoCard()}>
              {copy.sell.getDemo}
            </button>
          </div>
          {demo && (
            <div className="note good" style={{ margin: 0 }}>
              <b>
                <Icon name="check" />
                Demo card filled in
              </b>
              <p>{copy.sell.demoIssued}</p>
            </div>
          )}
          <button type="submit" hidden />
        </form>
        {askCents !== null && payoutCents !== null && feeCents !== null && (
          <div className="split">
            <div>
              <span>Shoppers pay</span>
              <span>{whole(askCents)}</span>
            </div>
            <div>
              <span>Sway service fee</span>
              <span>{whole(feeCents)}</span>
            </div>
            <div className="you">
              <span>You get</span>
              <span>{whole(payoutCents)}</span>
            </div>
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <div className="dock">
        <button className="cta" onClick={() => void submit()} disabled={!ready || !deployment}>
          <span>{copy.sell.submit}</span>
        </button>
      </div>
    </>
  );
}

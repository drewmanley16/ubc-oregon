"use client";
// LANE D. Receipt (prototype "receipt"). Reload-safe: always re-derived from GET /api/orders/:id (chain-confirmed).
// The gift card number + PIN are revealed only after the buyer signs a free message proving they paid.
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Hex } from "@sway/shared";
import { api, giftcards, type RevealedCard } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { getMerchantById } from "@/lib/merchants";
import { GiftCard, FlipCard } from "@/components/sway/GiftCard";
import { TopBar } from "@/components/sway/TopBar";
import { Icon } from "@/components/sway/Icon";
import { revealMessage } from "@/server/reveal-message";
import { copy } from "@/content/copy";

const deployment = getDeployment();
const dec = deployment?.usdcDecimals ?? 6;
const whole = (c: bigint | string) => formatCents(c).replace(".00", "");

export function ReceiptClient({ orderId, token, txHash }: { orderId: Hex; token: string; txHash?: Hex }) {
  const wallet = useSwayWallet();
  const [card, setCard] = useState<RevealedCard | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["order", orderId, "receipt"],
    queryFn: () => api.order(orderId, token, txHash),
    enabled: !!token,
    refetchInterval: (query) => (query.state.data?.state === "PAID" ? false : 2_000),
  });

  async function reveal() {
    if (revealing) return;
    setRevealing(true);
    setRevealError(null);
    try {
      if (wallet.status !== "signed-in") {
        wallet.signIn();
        return;
      }
      const signature = await wallet.signMessage(revealMessage(orderId));
      setCard(await giftcards.reveal({ orderId, token, tx: txHash ?? (q.data?.state === "PAID" ? q.data.receipt.txHash : undefined), signature }));
    } catch (e) {
      setRevealError((e as Error).message);
    } finally {
      setRevealing(false);
    }
  }

  if (!token) return <p className="err" role="alert">{copy.errors.missingReceiptToken}</p>;
  if (q.error) return <p className="err" role="alert">{(q.error as Error).message}</p>;
  if (!q.data || q.data.state !== "PAID")
    return (
      <div className="scroll">
        <div className="price" style={{ paddingTop: 60 }}>
          <div className="lbl">{copy.tx.confirmingReceipt}</div>
          <div className="skel" style={{ height: 96, width: 160, marginTop: 14 }} />
          <div className="skel" style={{ height: 18, width: 240, marginTop: 16 }} />
        </div>
      </div>
    );

  const { receipt } = q.data;
  const merchant = getMerchantById(receipt.merchantId)!;
  const paidCents = usdcUnitsToCentsExact(BigInt(receipt.usdcUnits), dec);
  const feeCents = usdcUnitsToCentsExact(BigInt(receipt.feeUnits), dec);

  return (
    <>
      <div className="scroll fresh">
        <TopBar />
        <div className="rc">
          <span className="badge">
            <Icon name="check" />
          </span>
          <div className="lbl">{copy.receipt.title}</div>
          <div className="big">{whole(receipt.grossSavingsCents)}</div>
          <p>
            Paid {whole(paidCents)} for a {whole(receipt.creditCents)} {merchant.name} gift card.
          </p>
        </div>

        <div className="gsec">
          <h4>{copy.card.title}</h4>
          {card ? (
            <>
              <FlipCard merchant={merchant} number={card.number} pin={card.pin} balanceCents={card.balanceCents} />
              <div className="card-meta">
                <Link className="textlink" href="/balance">
                  {copy.card.checkBalance}
                </Link>
                <p className="fine">Tap the card to flip it</p>
              </div>
              <p className="fine left">{copy.card.simulated}</p>
            </>
          ) : (
            <>
              <GiftCard merchant={merchant} valueCents={receipt.creditCents} />
              <button className="cta" onClick={() => void reveal()} disabled={revealing}>
                <span>
                  {revealing && <i className="spin" />}
                  {revealing ? copy.card.revealing : copy.card.reveal}
                </span>
              </button>
              <p className="fine">{copy.card.revealHint}</p>
            </>
          )}
          {revealError && <p className="err" style={{ margin: 0 }} role="alert">{revealError}</p>}
        </div>

        <div className="rcard">
          <div>
            <span>{copy.receipt.paid}</span>
            <span>{formatCents(paidCents)}</span>
          </div>
          <div>
            <span>Gift card value</span>
            <span>{formatCents(receipt.creditCents)}</span>
          </div>
          <div>
            <span>Sway service fee</span>
            <span>{formatCents(feeCents)} (included)</span>
          </div>
          <div>
            <span>Card&apos;s seller</span>
            <span>{copy.receipt.sellerTiming}</span>
          </div>
        </div>
        <a className="proof" href={receipt.explorerUrl} target="_blank" rel="noreferrer">
          <Icon name="doc" />
          {copy.receipt.viewOnExplorer}
        </a>
        <div className="footer-note">Payments are recorded on Arc, a public ledger.</div>
      </div>
      <div className="dock">
        <Link href="/" className="cta ghost" style={{ textDecoration: "none" }}>
          <span>{copy.receipt.backToShops}</span>
        </Link>
      </div>
    </>
  );
}

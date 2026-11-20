"use client";
// LANE D. Reload-safe: always re-derived from GET /api/orders/:id, which is chain-confirmed.
// The gift card number + PIN are revealed only after the buyer signs a free message proving they paid.
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Hex } from "@sway/shared";
import { api, giftcards, type RevealedCard } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { ReceiptCard } from "@/components/sway/ReceiptCard";
import { groupCardNumber } from "@/lib/format";
import { revealMessage } from "@/server/reveal-message";
import { copy } from "@/content/copy";

const deployment = getDeployment();

export function ReceiptClient({ orderId, token, txHash }: { orderId: Hex; token: string; txHash?: Hex }) {
  const wallet = useSwayWallet();
  const [card, setCard] = useState<RevealedCard | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["order", orderId, "receipt"],
    queryFn: () => api.order(orderId, token, txHash),
    enabled: !!token,
    // RPC can lag a block behind the wallet's receipt: poll until PAID.
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

  if (!token) return <p role="alert">Missing order token.</p>;
  if (q.error) return <p role="alert">{(q.error as Error).message}</p>;
  if (!q.data || q.data.state !== "PAID") return <p role="status">{copy.tx.pending}</p>;

  const { receipt, order } = q.data;
  const paidCents = usdcUnitsToCentsExact(BigInt(receipt.usdcUnits), deployment?.usdcDecimals ?? 6).toString();
  return (
    <div className="grid gap-5">
      <ReceiptCard receipt={receipt} retailCents={order.totalCents} paidCents={paidCents} />

      <section className="grid gap-3 rounded border p-4">
        <h2 className="text-xl font-medium">{copy.card.title}</h2>
        {!card ? (
          <>
            <button onClick={() => void reveal()} disabled={revealing} className="rounded bg-black px-5 py-4 text-lg text-white disabled:opacity-50">
              {revealing ? copy.card.revealing : copy.card.reveal}
            </button>
            <p className="text-sm opacity-70">{copy.card.revealHint}</p>
          </>
        ) : (
          <div className="grid gap-2" aria-live="polite">
            <div className="text-sm opacity-70">{card.merchantName}</div>
            <div>
              <div className="text-xs uppercase opacity-60">{copy.card.number}</div>
              <div className="font-mono text-2xl">{groupCardNumber(card.number)}</div>
            </div>
            <div>
              <div className="text-xs uppercase opacity-60">{copy.card.pin}</div>
              <div className="font-mono text-2xl">{card.pin}</div>
            </div>
            <div>
              {copy.card.balance}: {formatCents(card.balanceCents)}
            </div>
            <Link href="/balance" className="text-sm underline">
              {copy.card.checkBalance}
            </Link>
            <p className="text-xs opacity-60">{copy.card.simulated}</p>
          </div>
        )}
        {revealError && <p role="alert" className="text-red-700">{revealError}</p>}
      </section>
    </div>
  );
}

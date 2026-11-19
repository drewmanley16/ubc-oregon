"use client";
// LANE D. Flow: sign in -> card number + PIN -> POST /api/sell (verify, swap, mint, gas) -> list (2 wallet txs).
// Nothing is shown as "listed" until createListing's receipt succeeds.
import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { explorerTxUrl, formatCents, getDeployment, swayMarketplaceAbi, usdcUnitsToCentsExact, type Merchant } from "@sway/shared";
import { giftcards, type DemoCard, type Sale } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { useListCredit } from "@/lib/tx/use-list-credit";
import { AccountChip } from "@/components/sway/AccountChip";
import { groupCardNumber } from "@/lib/format";
import { copy } from "@/content/copy";

const deployment = getDeployment();
const DEMO_FACE_CENTS = 10_000n;

export function SellClient({ merchants }: { merchants: Merchant[] }) {
  const wallet = useSwayWallet();
  const [merchantId, setMerchantId] = useState(merchants[0].id);
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [demo, setDemo] = useState<DemoCard | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: listState, list } = useListCredit(deployment, wallet);

  const preview = useReadContract({
    address: deployment?.marketplace,
    abi: swayMarketplaceAbi,
    functionName: "previewPrice",
    args: [BigInt(merchantId), DEMO_FACE_CENTS],
    query: { enabled: !!deployment },
  });
  const payoutCents =
    preview.data && deployment ? usdcUnitsToCentsExact(preview.data[1], deployment.usdcDecimals) : null;

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
    if (busy || !wallet.address) return;
    setBusy(true);
    setError(null);
    try {
      const s = await giftcards.sell({ merchantId, number, pin, seller: wallet.address });
      setSale(s);
      await list(s.merchantId, BigInt(s.faceCents));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const merchantName = merchants.find((m) => m.id === merchantId)?.name ?? "";

  return (
    <div className="grid gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{copy.sell.title}</h1>
          <p className="opacity-70">{copy.sell.sub}</p>
        </div>
        <AccountChip wallet={wallet} />
      </header>

      {!deployment && <p role="alert">Sway contracts are not deployed on this network yet.</p>}

      {!sale && (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="grid gap-1">
            <span>{copy.sell.store}</span>
            <select value={merchantId} onChange={(e) => setMerchantId(Number(e.target.value))} className="rounded border p-2">
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span>{copy.sell.number}</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              value={number}
              onChange={(e) => setNumber(groupCardNumber(e.target.value))}
              className="rounded border p-2 font-mono"
              placeholder="7777 0000 0000 0000"
              required
            />
          </label>
          <label className="grid gap-1">
            <span>{copy.sell.pin}</span>
            <input inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} className="rounded border p-2 font-mono" required />
          </label>

          <div className="text-sm">
            {copy.sell.noCard}{" "}
            <button type="button" onClick={() => void getDemoCard()} className="underline">
              {copy.sell.getDemo}
            </button>
            {demo && <p className="mt-1 opacity-70">{copy.sell.demoIssued}</p>}
          </div>

          {payoutCents !== null && <p className="text-lg font-medium">{copy.sell.payout(formatCents(payoutCents))}</p>}

          {wallet.status !== "signed-in" ? (
            <button type="button" onClick={wallet.signIn} className="rounded bg-black px-5 py-4 text-lg text-white">
              {copy.sell.signIn}
            </button>
          ) : (
            <button type="submit" disabled={busy || !deployment} className="rounded bg-black px-5 py-4 text-lg text-white disabled:opacity-50">
              {busy ? copy.sell.verifying : copy.sell.submit}
            </button>
          )}
        </form>
      )}

      {sale && (
        <section className="grid gap-2 rounded border p-4" aria-live="polite">
          <p>✓ {copy.sell.verified(formatCents(sale.faceCents))} · {merchantName}</p>
          <p>✓ {copy.sell.swapped(sale.oldLast4)}</p>
          {sale.gasTx && <p className="text-sm opacity-70">{copy.sell.gasCovered}</p>}
          {listState.phase === "approving" && <p>{copy.sell.approving}</p>}
          {listState.phase === "listing" && <p>{copy.sell.listing}</p>}
          {listState.phase === "listed" && (
            <>
              <p className="text-lg font-medium">✓ {copy.sell.listed}</p>
              {payoutCents !== null && <p>{copy.sell.payout(formatCents(payoutCents))}</p>}
              <a className="underline" href={explorerTxUrl(listState.txHash)} target="_blank" rel="noreferrer">
                {copy.receipt.viewOnExplorer}
              </a>
            </>
          )}
          {(listState.phase === "rejected" || listState.phase === "failed" || listState.phase === "idle") && !busy && (
            <>
              {listState.phase === "rejected" && <p role="alert">{copy.sell.rejected}</p>}
              {listState.phase === "failed" && <p role="alert">{listState.message}</p>}
              <button onClick={() => void list(sale.merchantId, BigInt(sale.faceCents))} className="rounded bg-black px-5 py-3 text-white">
                {copy.sell.retryList}
              </button>
            </>
          )}
          {sale.mintTx && (
            <a className="text-sm underline opacity-70" href={explorerTxUrl(sale.mintTx)} target="_blank" rel="noreferrer">
              {copy.sell.mintTx}
            </a>
          )}
          <Link className="text-sm underline" href="/balance">
            {copy.sell.checkOld}
          </Link>
        </section>
      )}

      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  );
}

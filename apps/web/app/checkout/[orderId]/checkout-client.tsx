"use client";
// LANE D. Critical-path screen (prototype "checkout"). Order (signed) → quote → chain checks → approve → checkout → receipt.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Hex } from "@sway/shared";
import { api } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { useCheckout } from "@/lib/tx/use-checkout";
import { TopBar } from "@/components/sway/TopBar";
import { Icon, type IconName } from "@/components/sway/Icon";
import { copy } from "@/content/copy";

const deployment = getDeployment();
const dec = deployment?.usdcDecimals ?? 6;
const whole = (c: bigint | string) => formatCents(c).replace(".00", "");

function Note({ icon, title, body, tone = "calm" }: { icon: IconName; title: string; body?: string; tone?: "calm" | "alert" | "good" }) {
  return (
    <div className={`note ${tone}`} role={tone === "alert" ? "alert" : "status"}>
      <b>
        <Icon name={icon} />
        {title}
      </b>
      {body && <p>{body}</p>}
    </div>
  );
}

export function CheckoutClient({ orderId, token }: { orderId: Hex; token: string }) {
  const router = useRouter();
  const wallet = useSwayWallet();
  const [details, setDetails] = useState(false);

  const orderQ = useQuery({ queryKey: ["order", orderId], queryFn: () => api.order(orderId, token), enabled: !!token });
  const order = orderQ.data?.order;
  if (orderQ.data?.state === "PAID") router.replace(`/receipt/${orderId}?t=${encodeURIComponent(token)}`);

  const quoteQ = useQuery({
    queryKey: ["quote", order?.merchantId, order?.totalCents],
    queryFn: () => api.quote(order!.merchantId, order!.totalCents, orderId),
    enabled: !!order,
    refetchInterval: 30_000,
  });
  const qd = quoteQ.data;
  const quote = qd && !("reason" in qd) && qd.executable ? qd : null;
  const quoteError = qd && "reason" in qd ? qd.message : quoteQ.error ? (quoteQ.error as Error).message : null;

  // Fee line for "Price details": from the listing's locked payout (chain data via /api/listings).
  const listingsQ = useQuery({ queryKey: ["listings", order?.merchantId], queryFn: () => api.listings(order!.merchantId), enabled: !!quote });
  const listing = listingsQ.data?.find((l) => l.listingId === quote?.listingId);
  const feeCents = listing ? usdcUnitsToCentsExact(BigInt(listing.askUsdcUnits) - BigInt(listing.sellerPayoutUnits), dec) : null;

  const onConfirmed = useCallback(
    (txHash: Hex) => router.push(`/receipt/${orderId}?t=${encodeURIComponent(token)}&tx=${txHash}`),
    [router, orderId, token],
  );

  const { phase, pay, reset, secondsLeft } = useCheckout({
    deployment,
    wallet,
    quote,
    quoteError,
    quoteLoading: orderQ.isLoading || quoteQ.isLoading,
    orderId,
    orderTotalCents: order?.totalCents ?? "0",
    onConfirmed,
  });

  if (!token) return <p className="err" role="alert">{copy.errors.missingOrderToken}</p>;
  if (orderQ.error) return <p className="err" role="alert">{copy.errors.orderLoad}</p>;

  const payCents = quote ? usdcUnitsToCentsExact(BigInt(quote.askUsdcUnits), dec).toString() : null;
  const pay$ = payCents ? whole(payCents) : "";
  const refresh = () => {
    reset();
    void quoteQ.refetch();
  };

  let cta: { label: string; onClick?: () => void; spin?: boolean } = { label: copy.checkout.cta.payFallback };
  let note: React.ReactNode = null;
  switch (phase.phase) {
    case "loading-quote":
      cta = { label: "Checking prices", spin: true };
      break;
    case "signed-out":
      cta = { label: pay$ ? copy.checkout.cta.signInToPay(pay$) : copy.checkout.cta.signIn, onClick: wallet.signIn };
      break;
    case "wrong-network":
      note = <Note icon="alert" tone="alert" title={copy.tx.wrongNetwork} body="Your account is pointed somewhere else. One tap fixes it." />;
      cta = { label: "Switch and continue", onClick: () => void wallet.switchToArc() };
      break;
    case "needs-approval":
      note = <p className="fine" style={{ margin: "14px 20px 0", textAlign: "left" }}>{copy.tx.needsApproval}</p>;
      cta = { label: copy.checkout.cta.pay(pay$), onClick: () => void pay() };
      break;
    case "ready":
      cta = { label: copy.checkout.cta.pay(pay$), onClick: () => void pay() };
      break;
    case "rejected":
      note = <Note icon="info" title="Payment cancelled" body={copy.tx.rejected} />;
      cta = { label: copy.checkout.cta.pay(pay$), onClick: () => void pay() };
      break;
    case "approving":
      cta = { label: copy.tx.approving, spin: true };
      break;
    case "awaiting-signature":
      cta = { label: copy.tx.awaitingSignature, spin: true };
      break;
    case "pending":
      cta = { label: copy.tx.pending, spin: true };
      break;
    case "insufficient-funds":
      note = (
        <Note
          icon="alert"
          tone="alert"
          title={copy.tx.insufficientFunds}
          body={copy.tx.insufficientFundsDetail(
            formatCents(usdcUnitsToCentsExact(BigInt(phase.needUsdcUnits), dec)),
            formatCents(BigInt(phase.haveUsdcUnits) / 10n ** BigInt(dec - 2)),
          )}
        />
      );
      cta = { label: copy.checkout.cta.retry, onClick: refresh };
      break;
    case "quote-stale":
      note = <Note icon="clock" title="This price expired" body={copy.checkout.quoteStale} />;
      cta = { label: copy.checkout.cta.refresh, onClick: refresh };
      break;
    case "no-offer":
      note = <Note icon="info" title="No discounted cards right now" body={phase.message} />;
      cta = { label: copy.checkout.cta.retry, onClick: refresh };
      break;
    case "failed":
      note = <Note icon="alert" tone="alert" title={copy.tx.failed} body={/ListingNotActive/.test(phase.message) ? copy.tx.failedTaken : phase.message} />;
      cta = { label: copy.checkout.cta.findAnother, onClick: refresh };
      break;
  }
  const busy = !!cta.spin;
  const showPrice = !!quote && phase.phase !== "no-offer";
  const dim = phase.phase === "quote-stale";

  return (
    <>
      <div className="scroll fresh">
        <TopBar back="/" chip="Demo card" />
        {showPrice && payCents ? (
          <>
            <div className="price reveal">
              <div className="lbl">{copy.checkout.yourTotal}</div>
              <div className="was">{formatCents(quote.faceValueCents)}</div>
              <div className={`now${dim ? " dim" : ""}`}>{pay$}</div>
              {!dim && (
                <span className="saveline">
                  <Icon name="check" />
                  {copy.checkout.savingsLine(whole(quote.grossSavingsCents))}
                </span>
              )}
            </div>
            <div className={`details${details ? " open" : ""}`}>
              <button onClick={() => setDetails((d) => !d)} aria-expanded={details} aria-controls="pdrawer">
                {copy.checkout.priceDetails}
                <Icon name="down" />
              </button>
              <div className="drawer" id="pdrawer" inert={!details}>
                <div>
                  <div className="lines">
                    <div style={{ "--i": 0 } as React.CSSProperties}>
                      <span>{order?.lines[0]?.name ?? "Gift card"}</span>
                      <span>{formatCents(quote.faceValueCents)}</span>
                    </div>
                    <div className="g" style={{ "--i": 1 } as React.CSSProperties}>
                      <span>{copy.checkout.creditApplied}</span>
                      <span>−{formatCents(quote.grossSavingsCents)}</span>
                    </div>
                    <div className="tot" style={{ "--i": 2 } as React.CSSProperties}>
                      <span>{copy.checkout.youPay}</span>
                      <span>{formatCents(payCents)}</span>
                    </div>
                    {feeCents !== null && (
                      <div className="fee" style={{ "--i": 3 } as React.CSSProperties}>
                        <span>{copy.checkout.feeIncluded(whole(feeCents))}</span>
                        <span />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : phase.phase === "loading-quote" ? (
          <div className="price">
            <div className="lbl">{copy.checkout.finding}</div>
            <div className="skel" style={{ height: 22, width: 90, marginTop: 8 }} />
            <div className="skel" style={{ height: 86, width: 180, margin: "10px 0 12px" }} />
            <div className="skel" style={{ height: 30, width: 200, borderRadius: 999 }} />
          </div>
        ) : order ? (
          <div className="price">
            <div className="lbl">{copy.checkout.yourTotal}</div>
            <div className="now" style={{ fontSize: 72 }}>{whole(order.totalCents)}</div>
          </div>
        ) : null}
        {note}
      </div>
      <div className="dock">
        {quote && !busy && ["ready", "needs-approval", "signed-out", "rejected"].includes(phase.phase) && (
          <div className="timer">
            <Icon name="clock" />
            <span>{copy.checkout.quoteExpires(secondsLeft)}</span>
          </div>
        )}
        <button className={`cta${busy ? " hold done" : ""}`} onClick={cta.onClick} disabled={busy || !cta.onClick}>
          {busy && <i className="fill" />}
          <span>
            {busy && <i className="spin" />}
            {cta.label}
          </span>
        </button>
        {(phase.phase === "no-offer" || phase.phase === "failed") && (
          <button className="cta ghost" onClick={() => router.push("/")}>
            <span>{copy.checkout.cta.backToStore}</span>
          </button>
        )}
      </div>
    </>
  );
}

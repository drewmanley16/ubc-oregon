"use client";
// LANE D. Critical-path screen. Order (signed) → quote → chain checks → approve → checkout → receipt.
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCents, getDeployment, usdcUnitsToCentsExact, type Hex } from "@sway/shared";
import { api } from "@/lib/api";
import { useSwayWallet } from "@/lib/wallet/use-sway-wallet";
import { useCheckout } from "@/lib/tx/use-checkout";
import { QuoteCard } from "@/components/sway/QuoteCard";
import { OrderSummary } from "@/components/sway/OrderSummary";
import { TxProgress } from "@/components/sway/TxProgress";
import { AccountChip } from "@/components/sway/AccountChip";
import { copy } from "@/content/copy";

const deployment = getDeployment();

export function CheckoutClient({ orderId, token }: { orderId: Hex; token: string }) {
  const router = useRouter();
  const wallet = useSwayWallet();

  const orderQ = useQuery({ queryKey: ["order", orderId], queryFn: () => api.order(orderId, token), enabled: !!token });
  const order = orderQ.data?.order;
  // Already paid (e.g. reload after success) → receipt.
  if (orderQ.data?.state === "PAID") router.replace(`/receipt/${orderId}?t=${encodeURIComponent(token)}`);

  const quoteQ = useQuery({
    queryKey: ["quote", order?.merchantId, order?.totalCents],
    queryFn: () => api.quote(order!.merchantId, order!.totalCents),
    enabled: !!order,
    refetchInterval: 30_000,
  });
  const qd = quoteQ.data;
  const quote = qd && !("reason" in qd) && qd.executable ? qd : null;
  const quoteError = qd && "reason" in qd ? qd.message : quoteQ.error ? (quoteQ.error as Error).message : null;

  const onConfirmed = useCallback(
    () => router.push(`/receipt/${orderId}?t=${encodeURIComponent(token)}`),
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

  if (!token) return <p role="alert">This checkout link is missing its order token. Start again from the store.</p>;
  if (orderQ.error) return <p role="alert">Couldn&apos;t load this order: {(orderQ.error as Error).message}</p>;

  const payCents = quote && deployment ? usdcUnitsToCentsExact(BigInt(quote.askUsdcUnits), deployment.usdcDecimals).toString() : null;

  let cta: { label: string; onClick?: () => void; disabled?: boolean };
  switch (phase.phase) {
    case "signed-out":
      cta = { label: copy.checkout.cta.signIn, onClick: wallet.signIn };
      break;
    case "wrong-network":
      cta = { label: copy.tx.wrongNetwork, onClick: () => void wallet.switchToArc() };
      break;
    case "needs-approval":
    case "ready":
      cta = { label: payCents ? copy.checkout.cta.pay(formatCents(payCents)) : "Pay", onClick: () => void pay() };
      break;
    case "rejected":
      cta = { label: payCents ? copy.checkout.cta.pay(formatCents(payCents)) : "Try again", onClick: () => void pay() };
      break;
    case "quote-stale":
      cta = { label: copy.checkout.cta.refresh, onClick: () => { reset(); void quoteQ.refetch(); } };
      break;
    case "failed":
      cta = { label: "Try again", onClick: () => { reset(); void quoteQ.refetch(); } };
      break;
    default:
      cta = { label: "Pay", disabled: true };
  }
  const busy = ["approving", "awaiting-signature", "pending", "loading-quote"].includes(phase.phase);

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{copy.checkout.title}</h1>
        <AccountChip wallet={wallet} />
      </header>
      {order && <OrderSummary order={order} />}
      {quote && payCents && <QuoteCard quote={quote} payCents={payCents} secondsLeft={secondsLeft} />}
      <TxProgress state={phase} />
      <button
        onClick={cta.onClick}
        disabled={busy || cta.disabled || !cta.onClick}
        className="rounded bg-black px-5 py-4 text-lg text-white disabled:opacity-50"
      >
        {cta.label}
      </button>
    </div>
  );
}

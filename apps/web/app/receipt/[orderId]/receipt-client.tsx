"use client";
// LANE D. Reload-safe: always re-derived from GET /api/orders/:id, which is chain-confirmed (lane C).
import { useQuery } from "@tanstack/react-query";
import { getDeployment, usdcUnitsToCentsExact, type Hex } from "@sway/shared";
import { api } from "@/lib/api";
import { ReceiptCard } from "@/components/sway/ReceiptCard";
import { copy } from "@/content/copy";

const deployment = getDeployment();

export function ReceiptClient({ orderId, token, txHash }: { orderId: Hex; token: string; txHash?: Hex }) {
  const q = useQuery({
    queryKey: ["order", orderId, "receipt"],
    queryFn: () => api.order(orderId, token, txHash),
    enabled: !!token,
    // Indexers/RPC can lag a block behind the wallet's receipt: poll until PAID.
    refetchInterval: (query) => (query.state.data?.state === "PAID" ? false : 2_000),
  });

  if (!token) return <p role="alert">Missing order token.</p>;
  if (q.error) return <p role="alert">{(q.error as Error).message}</p>;
  if (!q.data || q.data.state !== "PAID") return <p role="status">{copy.tx.pending}</p>;

  const { receipt, order } = q.data;
  const paidCents = usdcUnitsToCentsExact(BigInt(receipt.usdcUnits), deployment?.usdcDecimals ?? 6).toString();
  return <ReceiptCard receipt={receipt} retailCents={order.totalCents} paidCents={paidCents} />;
}

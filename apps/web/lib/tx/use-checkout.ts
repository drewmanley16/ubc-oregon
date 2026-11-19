"use client";
// LANE D. Drives CheckoutPhase from live chain state + user actions.
// Safety rules enforced here:
//   - Re-reads the listing ON CHAIN before paying; a server quote alone is never trusted.
//   - maxUsdcUnits passed to checkout == the ask the user was shown (on-chain slippage guard).
//   - "confirmed" only after waitForTransactionReceipt(...).status === "success".
//   - One in-flight submission at a time (double-click safe).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { BaseError, UserRejectedRequestError, erc20Abi, type Hash } from "viem";
import { swayMarketplaceAbi, type CheckoutQuote, type Deployment, type Hex } from "@sway/shared";
import type { SwayWallet } from "@/lib/wallet/types";
import type { CheckoutPhase } from "./types";

const LISTING_ACTIVE = 1;

type Action =
  | { kind: "idle" }
  | { kind: "approving"; txHash?: Hex }
  | { kind: "awaiting-signature" }
  | { kind: "pending"; txHash: Hex }
  | { kind: "rejected" }
  | { kind: "failed"; message: string; txHash?: Hex };

export type UseCheckoutArgs = {
  deployment: Deployment | null;
  wallet: SwayWallet;
  quote: CheckoutQuote | null;
  quoteError?: string | null; // e.g. NoQuote message
  quoteLoading: boolean;
  orderId: Hex; // from the signed order (POST /api/orders) — the id that gets settled on chain
  orderTotalCents: string;
  onConfirmed: (txHash: Hex) => void;
};

function isUserRejection(err: unknown) {
  if (err instanceof BaseError) return !!err.walk((e) => e instanceof UserRejectedRequestError);
  return /reject|denied|cancel/i.test(String((err as Error)?.message ?? err));
}

function shortError(err: unknown) {
  if (err instanceof BaseError) return err.shortMessage;
  return (err as Error)?.message ?? "Unknown error";
}

export function useCheckout({ deployment, wallet, quote, quoteError, quoteLoading, orderId, orderTotalCents, onConfirmed }: UseCheckoutArgs) {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [action, setAction] = useState<Action>({ kind: "idle" });
  const inFlight = useRef(false);

  const market = deployment?.marketplace;
  const usdc = deployment?.usdc;
  const buyer = wallet.address;
  const enabled = !!market && !!quote;

  const listing = useReadContract({
    address: market,
    abi: swayMarketplaceAbi,
    functionName: "getListing",
    args: quote ? [BigInt(quote.listingId)] : undefined,
    query: { enabled, refetchInterval: 8_000 },
  });
  const allowance = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: buyer && market ? [buyer, market] : undefined,
    query: { enabled: enabled && !!buyer },
  });
  const balance = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: buyer ? [buyer] : undefined,
    query: { enabled: enabled && !!buyer, refetchInterval: 15_000 },
  });

  // Quote freshness (UI only — the chain enforces the real guard).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = quote ? Math.max(0, Math.floor((Date.parse(quote.expiresAt) - now) / 1000)) : 0;

  const ask = quote ? BigInt(quote.askUsdcUnits) : 0n;

  const phase: CheckoutPhase = useMemo(() => {
    switch (action.kind) {
      case "approving":
        return { phase: "approving", txHash: action.txHash };
      case "awaiting-signature":
        return { phase: "awaiting-signature" };
      case "pending":
        return { phase: "pending", txHash: action.txHash };
      case "failed":
        return { phase: "failed", message: action.message, txHash: action.txHash };
      case "rejected":
        return { phase: "rejected" };
    }
    if (!deployment) return { phase: "failed", message: "Sway contracts are not deployed on this network yet." };
    if (quoteLoading) return { phase: "loading-quote" };
    if (!quote) return { phase: "no-offer", message: quoteError ?? "No savings available right now." };
    if (wallet.status !== "signed-in") return { phase: "signed-out" };
    if (!wallet.onArc) return { phase: "wrong-network" };

    const l = listing.data;
    if (l) {
      const stale =
        Number(l.status) !== LISTING_ACTIVE ||
        l.merchantId !== BigInt(quote.merchantId) ||
        l.creditCents !== BigInt(orderTotalCents) ||
        l.askUsdcUnits > ask;
      if (stale) return { phase: "quote-stale" };
    }
    if (secondsLeft === 0) return { phase: "quote-stale" };
    if (balance.data !== undefined && balance.data < ask)
      return { phase: "insufficient-funds", needUsdcUnits: ask.toString(), haveUsdcUnits: balance.data.toString() };
    if (allowance.data !== undefined && allowance.data < ask) return { phase: "needs-approval" };
    if (!l || allowance.data === undefined || balance.data === undefined) return { phase: "loading-quote" };
    return { phase: "ready" };
  }, [action, deployment, quoteLoading, quote, quoteError, wallet, listing.data, orderTotalCents, ask, secondsLeft, balance.data, allowance.data]);

  /** Approve (if needed) then checkout. Safe to call from any button; ignores re-entry. */
  const pay = useCallback(async () => {
    if (inFlight.current || !quote || !market || !usdc || !publicClient || !buyer) return;
    if (phase.phase !== "ready" && phase.phase !== "needs-approval" && phase.phase !== "rejected") return;
    inFlight.current = true;
    let txHash: Hash | undefined;
    try {
      // Fresh on-chain checks right before signing.
      const [onchainAllowance, l] = await Promise.all([
        publicClient.readContract({ address: usdc, abi: erc20Abi, functionName: "allowance", args: [buyer, market] }),
        publicClient.readContract({ address: market, abi: swayMarketplaceAbi, functionName: "getListing", args: [BigInt(quote.listingId)] }),
      ]);
      if (Number(l.status) !== LISTING_ACTIVE || l.askUsdcUnits > ask) {
        setAction({ kind: "idle" });
        await listing.refetch();
        return;
      }

      if (onchainAllowance < ask) {
        setAction({ kind: "approving" });
        const approveHash = await writeContractAsync({ address: usdc, abi: erc20Abi, functionName: "approve", args: [market, ask] });
        setAction({ kind: "approving", txHash: approveHash });
        const r = await publicClient.waitForTransactionReceipt({ hash: approveHash });
        if (r.status !== "success") throw new Error("Payment approval failed on chain.");
        await allowance.refetch();
      }

      setAction({ kind: "awaiting-signature" });
      txHash = await writeContractAsync({
        address: market,
        abi: swayMarketplaceAbi,
        functionName: "checkout",
        args: [BigInt(quote.listingId), orderId, BigInt(quote.merchantId), ask, BigInt(orderTotalCents)],
      });
      setAction({ kind: "pending", txHash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setAction({ kind: "failed", message: "The transaction reverted. You haven't been charged.", txHash });
        return;
      }
      onConfirmed(txHash);
    } catch (err) {
      if (isUserRejection(err)) setAction({ kind: "rejected" });
      else setAction({ kind: "failed", message: shortError(err), txHash });
    } finally {
      inFlight.current = false;
      void Promise.all([listing.refetch(), allowance.refetch(), balance.refetch()]);
    }
  }, [quote, market, usdc, publicClient, buyer, phase.phase, ask, orderId, orderTotalCents, writeContractAsync, onConfirmed, listing, allowance, balance]);

  const reset = useCallback(() => setAction({ kind: "idle" }), []);

  return { phase, pay, reset, secondsLeft };
}

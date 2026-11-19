"use client";
// LANE D. Seller lists their freshly minted credit: setApprovalForAll (once) -> createListing.
// "listed" only after createListing's receipt status === "success".
import { useCallback, useRef, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { BaseError, UserRejectedRequestError, decodeEventLog } from "viem";
import { merchantCreditAbi, swayMarketplaceAbi, type Deployment, type Hex } from "@sway/shared";
import type { SwayWallet } from "@/lib/wallet/types";

export type ListPhase =
  | { phase: "idle" }
  | { phase: "approving"; txHash?: Hex }
  | { phase: "listing"; txHash?: Hex }
  | { phase: "listed"; txHash: Hex; listingId: string }
  | { phase: "rejected" }
  | { phase: "failed"; message: string; txHash?: Hex };

const rejected = (e: unknown) =>
  e instanceof BaseError ? !!e.walk((x) => x instanceof UserRejectedRequestError) : /reject|denied|cancel/i.test(String(e));

export function useListCredit(deployment: Deployment | null, wallet: SwayWallet) {
  const pc = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ListPhase>({ phase: "idle" });
  const busy = useRef(false);

  const list = useCallback(
    async (merchantId: number, cents: bigint) => {
      if (busy.current || !deployment || !pc || !wallet.address) return;
      busy.current = true;
      let txHash: Hex | undefined;
      try {
        if (!wallet.onArc) await wallet.switchToArc();
        const approved = await pc.readContract({
          address: deployment.merchantCredit,
          abi: merchantCreditAbi,
          functionName: "isApprovedForAll",
          args: [wallet.address, deployment.marketplace],
        });
        if (!approved) {
          setState({ phase: "approving" });
          txHash = await writeContractAsync({
            address: deployment.merchantCredit,
            abi: merchantCreditAbi,
            functionName: "setApprovalForAll",
            args: [deployment.marketplace, true],
          });
          setState({ phase: "approving", txHash });
          const r = await pc.waitForTransactionReceipt({ hash: txHash });
          if (r.status !== "success") throw new Error("Approval failed on chain.");
        }
        setState({ phase: "listing" });
        txHash = await writeContractAsync({
          address: deployment.marketplace,
          abi: swayMarketplaceAbi,
          functionName: "createListing",
          args: [BigInt(merchantId), cents],
        });
        setState({ phase: "listing", txHash });
        const r = await pc.waitForTransactionReceipt({ hash: txHash });
        if (r.status !== "success") throw new Error("Listing reverted on chain.");
        let listingId = "";
        for (const log of r.logs) {
          try {
            const ev = decodeEventLog({ abi: swayMarketplaceAbi, data: log.data, topics: log.topics });
            if (ev.eventName === "ListingCreated") listingId = ev.args.listingId.toString();
          } catch {
            /* other contract's log */
          }
        }
        setState({ phase: "listed", txHash, listingId });
      } catch (e) {
        setState(rejected(e) ? { phase: "rejected" } : { phase: "failed", message: e instanceof BaseError ? e.shortMessage : (e as Error).message, txHash });
      } finally {
        busy.current = false;
      }
    },
    [deployment, pc, wallet, writeContractAsync],
  );

  return { state, list };
}

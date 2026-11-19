// LANE C. POST /api/cards/reveal {orderId, token, tx?, signature} -> the buyer's gift card (number + PIN).
// Released ONLY when: order token valid, CheckoutCompleted(orderId) confirmed on chain, and the
// signature proves the caller controls the wallet that paid (receipt.buyer).
import { z } from "zod";
import { verifyMessage } from "viem";
import type { Hex } from "@sway/shared";
import { apiError } from "@/server/http";
import { verifyOrderToken } from "@/server/orders";
import { findCheckoutReceipt } from "@/server/chain";
import { claimForOrder, GiftCardError, revealCard } from "@/server/giftcards";
import { getMerchantById } from "@/server/seed";
import { revealMessage } from "@/server/reveal-message";

const hex32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const Body = z.object({ orderId: hex32, token: z.string().min(10), tx: hex32.optional(), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });

export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return apiError(400, "BAD_REQUEST", "Missing order or signature.");
  const { orderId, token, tx, signature } = b.data;
  const order = verifyOrderToken(token);
  if (!order || order.orderId.toLowerCase() !== orderId.toLowerCase()) return apiError(401, "BAD_TOKEN", "This order link is invalid.");
  try {
    const receipt = await findCheckoutReceipt(order.orderId, tx as Hex | undefined);
    if (!receipt) return apiError(402, "NOT_PAID", "We can't see a confirmed payment for this order yet.");
    const ok = await verifyMessage({ address: receipt.buyer, message: revealMessage(order.orderId), signature: signature as Hex }).catch(() => false);
    if (!ok) return apiError(403, "NOT_BUYER", "Only the account that paid can view this card.");
    const vaultNumber = await claimForOrder(order.orderId, receipt.merchantId, receipt.creditCents);
    const card = await revealCard(vaultNumber);
    return Response.json(
      { ...card, merchantName: getMerchantById(card.merchantId)?.name ?? "", simulated: true },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof GiftCardError) return apiError(e.code === "BUSY" ? 409 : 500, e.code, e.message);
    console.error("reveal failed", e);
    return apiError(503, "CHAIN_UNAVAILABLE", "Couldn't reach the Arc network. Try again in a moment.");
  }
}

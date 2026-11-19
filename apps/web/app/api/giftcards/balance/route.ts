// LANE C. POST /api/giftcards/balance {number, pin} -> SIMULATED retailer balance check.
import { z } from "zod";
import { apiError } from "@/server/http";
import { checkBalance, GiftCardError } from "@/server/giftcards";

const Body = z.object({ number: z.string().min(12).max(40), pin: z.string().min(4).max(12) });

export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return apiError(400, "BAD_REQUEST", "Enter the card number and PIN.");
  try {
    return Response.json(await checkBalance(b.data.number, b.data.pin), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof GiftCardError) return apiError(e.code === "BAD_PIN" || e.code === "CARD_NOT_FOUND" ? 404 : 400, e.code, e.message);
    console.error("balance failed", (e as Error).message);
    return apiError(500, "INTERNAL", "Balance check failed.");
  }
}

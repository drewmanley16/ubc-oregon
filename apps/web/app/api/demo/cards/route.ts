// LANE C. POST /api/demo/cards {merchantId} -> a fresh SIMULATED $10 store gift card (number + PIN).
// Stands in for "you got a gift card for your birthday". Rate-limited per IP.
import { z } from "zod";
import { apiError } from "@/server/http";
import { getMerchantById } from "@/server/seed";
import { issuePublicCard } from "@/server/giftcards";
import { kv } from "@/server/kv";
import { DEMO_FACE_CENTS } from "@/lib/demo";

const Body = z.object({ merchantId: z.number().int().positive() });
const DEMO_CARD_CENTS = DEMO_FACE_CENTS;

export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success || !getMerchantById(b.data.merchantId)) return apiError(400, "BAD_REQUEST", "Unknown store.");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await kv().setNX(`rl:democard:${ip}`, 1, 5))) return apiError(429, "RATE_LIMITED", "Slow down — try again in a few seconds.");
  try {
    return Response.json(await issuePublicCard(b.data.merchantId, DEMO_CARD_CENTS), { status: 201 });
  } catch (e) {
    console.error("demo card failed", (e as Error).message);
    return apiError(500, "INTERNAL", "Couldn't create a demo card.");
  }
}

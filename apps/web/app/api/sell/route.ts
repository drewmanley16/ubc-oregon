// LANE C. POST /api/sell {merchantId, number, pin, seller} | {saleId, seller}
// Verify -> swap into Sway vault (seller's number becomes $0) -> mint on-chain credit to seller -> gas top-up.
// The seller then lists from their own wallet (setApprovalForAll + createListing).
import { z } from "zod";
import type { Address } from "@sway/shared";
import { apiError } from "@/server/http";
import { getMerchantById } from "@/server/seed";
import { GiftCardError } from "@/server/giftcards";
import { resumeSale, submitCard } from "@/server/sales";

const addr = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const Body = z.union([
  z.object({ merchantId: z.number().int().positive(), number: z.string().min(12).max(40), pin: z.string().min(4).max(12), seller: addr }),
  z.object({ saleId: z.string().uuid(), seller: addr }),
]);

export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return apiError(400, "BAD_REQUEST", "Enter the card number, PIN and sign in first.");
  try {
    if ("saleId" in b.data) {
      const s = await resumeSale(b.data.saleId, b.data.seller as Address);
      return s ? Response.json(s) : apiError(404, "NOT_FOUND", "Sale not found.");
    }
    if (!getMerchantById(b.data.merchantId)) return apiError(400, "BAD_REQUEST", "Unknown store.");
    const sale = await submitCard({ ...b.data, seller: b.data.seller as Address });
    return Response.json(sale, { status: 201 });
  } catch (e) {
    if (e instanceof GiftCardError) return apiError(e.code === "BUSY" ? 409 : 400, e.code, e.message);
    console.error("sell failed", e);
    return apiError(502, "SELL_FAILED", "Your card was checked, but we couldn't finish adding it. Try again in a moment.");
  }
}

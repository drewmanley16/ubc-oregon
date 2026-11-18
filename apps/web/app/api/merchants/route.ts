// LANE C. GET /api/merchants — source of truth: server/seed.ts
import { MERCHANTS } from "@/server/seed";

export function GET() {
  return Response.json(MERCHANTS);
}

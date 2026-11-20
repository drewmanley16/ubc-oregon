// Client-safe merchant lookup (same fictional seed the server uses).
import { MERCHANTS } from "@/server/seed";
export const getMerchantById = (id: number) => MERCHANTS.find((m) => m.id === id);

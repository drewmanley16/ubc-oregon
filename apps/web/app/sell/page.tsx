// LANE D. Seller: submit a gift card -> verify + swap (server) -> list from own account.
import { MERCHANTS } from "@/server/seed";
import { SellClient } from "./sell-client";

export default function SellPage() {
  return <SellClient merchants={MERCHANTS} />;
}

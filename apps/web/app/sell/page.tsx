// LANE D. Seller: submit a gift card -> verify + swap (server) -> list from own wallet.
import { MERCHANTS } from "@/server/seed";
import { SellClient } from "./sell-client";

export default function SellPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <SellClient merchants={MERCHANTS} />
    </main>
  );
}

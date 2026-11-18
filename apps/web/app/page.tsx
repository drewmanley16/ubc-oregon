// LANE D wires (data/flow); LANE B styles; LANE A copy. Landing + merchant picker.
import { MERCHANTS } from "@/server/seed";
import { MerchantCard } from "@/components/sway/MerchantCard";
import { copy } from "@/content/copy";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-4xl font-semibold">{copy.landing.headline}</h1>
      <p>{copy.landing.sub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {MERCHANTS.map((m) => <MerchantCard key={m.id} merchant={m} />)}
      </div>
    </main>
  );
}

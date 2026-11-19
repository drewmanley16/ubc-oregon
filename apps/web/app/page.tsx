// LANE D wires (data/flow); LANE B styles; LANE A copy. Landing: buy or sell gift cards.
import Link from "next/link";
import { MERCHANTS } from "@/server/seed";
import { MerchantCard } from "@/components/sway/MerchantCard";
import { copy } from "@/content/copy";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-4xl font-semibold">{copy.landing.headline}</h1>
      <p className="mt-2 max-w-2xl">{copy.landing.sub}</p>
      <div className="mt-6 flex gap-3">
        <a href="#stores" className="rounded bg-black px-5 py-3 text-white">{copy.landing.buyCta}</a>
        <Link href="/sell" className="rounded border px-5 py-3">{copy.landing.sellCta}</Link>
      </div>
      <div id="stores" className="mt-8 grid gap-4 sm:grid-cols-3">
        {MERCHANTS.map((m) => <MerchantCard key={m.id} merchant={m} />)}
      </div>
      <section className="mt-10 max-w-2xl">
        <h2 className="text-xl font-medium">{copy.landing.howTitle}</h2>
        <ol className="mt-2 list-decimal pl-5">
          {copy.landing.how.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>
    </main>
  );
}

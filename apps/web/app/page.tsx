// LANE D wires; LANE B styles; LANE A copy. Landing: headline, shops, sell link. Nothing else.
import Link from "next/link";
import { MERCHANTS } from "@/server/seed";
import { TopBar } from "@/components/sway/TopBar";
import { ShopList } from "@/components/sway/ShopList";
import { copy } from "@/content/copy";
import { Intro } from "@/components/sway/Intro";

export default function Home() {
  return (
    <>
    <Intro />
    <div className="scroll fresh">
      <TopBar />
      <div className="pad">
        <h1 className="h-land">{copy.landing.headline}</h1>
      </div>
      <ShopList merchants={MERCHANTS} />
      <Link href="/sell" className="secondary-link">
        {copy.landing.sellCta} →
      </Link>
    </div>
    </>
  );
}

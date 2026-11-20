// LANE D wires; LANE B styles (prototype "landing"); LANE A copy.
import Link from "next/link";
import { MERCHANTS } from "@/server/seed";
import { TopBar } from "@/components/sway/TopBar";
import { ShopList } from "@/components/sway/ShopList";
import { Icon } from "@/components/sway/Icon";
import { copy } from "@/content/copy";

export default function Home() {
  return (
    <div className="scroll fresh">
      <TopBar />
      <div className="pad">
        <h1 className="h-land">{copy.landing.headline}</h1>
        <p className="sub">{copy.landing.sub}</p>
      </div>
      <ShopList merchants={MERCHANTS} />
      <div className="pills">
        {copy.landing.how.map((line, i) => (
          <div key={line} className="pill-row">
            <Icon name={(["lock", "check", "clock"] as const)[i] ?? "check"} />
            <span>{line}</span>
          </div>
        ))}
      </div>
      <Link href="/sell" className="secondary-link">
        <span>Have a card you won&apos;t use?</span> {copy.landing.sellCta} →
      </Link>
      <div className="footer-note">Payments are recorded on Arc, a public ledger.</div>
    </div>
  );
}

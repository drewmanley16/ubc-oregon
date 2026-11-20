// LANE D wires; LANE B styles (prototype "landing"); LANE A copy.
import Link from "next/link";
import { MERCHANTS } from "@/server/seed";
import { TopBar } from "@/components/sway/TopBar";
import { ShopList } from "@/components/sway/ShopList";
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
      <div className="note calm">
        <b>{copy.landing.howTitle}</b>
        <ol style={{ margin: "4px 0 0", paddingLeft: 18, color: "var(--s-muted)" }}>
          {copy.landing.how.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="pad" style={{ marginTop: 16 }}>
        <Link href="/sell" className="cta ghost" style={{ textDecoration: "none" }}>
          <span>{copy.landing.sellCta}</span>
        </Link>
      </div>
      <div className="footer-note">Payments are recorded on Arc, a public ledger.</div>
    </div>
  );
}

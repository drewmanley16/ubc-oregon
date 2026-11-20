// LANE B styles. Always visible: honesty requirement (spec §1 caveat, §4).
import { copy } from "@/content/copy";

export function DemoBanner() {
  return <div className="demo-band" style={{ paddingTop: 8 }}>{copy.landing.demoBadge}</div>;
}

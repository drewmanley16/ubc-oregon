// LANE B styles. Always visible: honesty requirement (spec §1 caveat, §4).
import { copy } from "@/content/copy";

export function DemoBanner() {
  return <div className="w-full bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">{copy.disclaimer}</div>;
}

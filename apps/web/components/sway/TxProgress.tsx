// LANE B styles every phase; lane D drives `state`. Must render ALL phases in lib/tx/types.ts.
import type { CheckoutPhase } from "@/lib/tx/types";

export function TxProgress({ state }: { state: CheckoutPhase }) {
  return <div role="status" aria-live="polite" data-phase={state.phase}>{state.phase}</div>;
}

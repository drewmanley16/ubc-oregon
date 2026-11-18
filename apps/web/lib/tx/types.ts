// LANE D owns. Checkout state machine. Matches the UX screen-state matrix (docs/lanes/A-ux.md).
// Invariant: "confirmed" is entered ONLY after waitForTransactionReceipt returns status === "success".
import type { CheckoutReceipt, Hex } from "@sway/shared";

export type CheckoutPhase =
  | { phase: "loading-quote" }
  | { phase: "no-offer"; message: string }
  | { phase: "signed-out" }
  | { phase: "wrong-network" }
  | { phase: "insufficient-funds"; needUsdcUnits: string; haveUsdcUnits: string }
  | { phase: "needs-approval" }
  | { phase: "approving"; txHash?: Hex }
  | { phase: "ready" } // allowance OK, quote fresh
  | { phase: "quote-stale" }
  | { phase: "awaiting-signature" }
  | { phase: "pending"; txHash: Hex }
  | { phase: "confirmed"; receipt: CheckoutReceipt }
  | { phase: "rejected" } // user dismissed the signature — back to "ready", no error tone
  | { phase: "failed"; message: string; txHash?: Hex };

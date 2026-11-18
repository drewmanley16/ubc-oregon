// LANE B styles. Props contract shared with lane D. Data comes ONLY from a chain-confirmed receipt.
import type { CheckoutReceipt } from "@sway/shared";
import { Price } from "./Price";

export function ReceiptCard({ receipt, retailCents, paidCents }: { receipt: CheckoutReceipt; retailCents: string; paidCents: string }) {
  return (
    <section className="rounded border p-4">
      <div>You saved <Price cents={receipt.grossSavingsCents} size="xl" /></div>
      <div>Retail <Price cents={retailCents} /> · Paid <Price cents={paidCents} /></div>
      {/* sellerPayoutUnits / feeUnits are USDC units; lane D converts before display if shown */}
      <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">View transaction</a>
    </section>
  );
}

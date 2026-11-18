// LANE D. See receipt-client.tsx.
import type { Hex } from "@sway/shared";
import { ReceiptClient } from "./receipt-client";

export default async function ReceiptPage(props: PageProps<"/receipt/[orderId]">) {
  const { orderId } = await props.params;
  const { t } = await props.searchParams;
  return (
    <main className="mx-auto max-w-xl p-6">
      <ReceiptClient orderId={orderId as Hex} token={typeof t === "string" ? t : ""} />
    </main>
  );
}

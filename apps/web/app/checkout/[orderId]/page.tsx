// LANE D. See checkout-client.tsx for the flow.
import type { Hex } from "@sway/shared";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage(props: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await props.params;
  const { t } = await props.searchParams;
  return (
    <main className="mx-auto max-w-xl p-6">
      <CheckoutClient orderId={orderId as Hex} token={typeof t === "string" ? t : ""} />
    </main>
  );
}

// LANE D. THE critical-path screen. Client component flow (TODO lane-D):
//   verify order (GET /api/orders/:id?token) -> GET /api/quote -> chain re-check getListing ->
//   sign in (Privy) -> balance/allowance check -> approve if needed -> checkout(listingId, orderId,
//   merchantId, maxUsdcUnits=quote.askUsdcUnits, expectedCreditCents=order.totalCents) ->
//   waitForTransactionReceipt(status success) -> /receipt/[orderId]. Disable button while in flight.
export default async function CheckoutPage(props: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await props.params;
  return <main className="mx-auto max-w-xl p-6"><h1>Checkout</h1><p>Order {orderId} — TODO(lane-D)</p></main>;
}

// LANE D (lane C may take this if capacity). Reload-safe: always re-derive from GET /api/orders/:id (chain-confirmed).
export default async function ReceiptPage(props: PageProps<"/receipt/[orderId]">) {
  const { orderId } = await props.params;
  return <main className="mx-auto max-w-xl p-6"><h1>Receipt</h1><p>Order {orderId} — TODO(lane-D)</p></main>;
}

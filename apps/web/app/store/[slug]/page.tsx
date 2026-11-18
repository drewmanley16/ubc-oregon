// LANE D. Store + sample $100 cart. TODO(lane-D): "Checkout" -> POST /api/orders -> /checkout/[orderId]?t=token
import { notFound } from "next/navigation";
import { getMerchantBySlug, getProducts } from "@/server/seed";
import { ProductCard } from "@/components/sway/ProductCard";

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) notFound();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{merchant.name}</h1>
      <div className="mt-6 grid gap-3">
        {getProducts(merchant.id).map((p) => <ProductCard key={p.id} product={p} quantity={1} />)}
      </div>
    </main>
  );
}

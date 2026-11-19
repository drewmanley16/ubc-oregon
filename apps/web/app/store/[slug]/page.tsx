// LANE D. Store + sample $100 cart.
import { notFound } from "next/navigation";
import { getMerchantBySlug, getProducts } from "@/server/seed";
import { StoreCart } from "./cart";

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) notFound();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{merchant.name}</h1>
      {merchant.tagline && <p className="opacity-70">{merchant.tagline}</p>}
      <StoreCart merchant={merchant} products={getProducts(merchant.id)} />
    </main>
  );
}

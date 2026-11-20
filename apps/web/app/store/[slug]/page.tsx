// LANE D. Store page: the store's $100 gift card with the live Sway price.
import { notFound } from "next/navigation";
import { getMerchantBySlug, getProducts } from "@/server/seed";
import { GiftCardOffer } from "./offer";

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) notFound();
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">{merchant.name}</h1>
      {merchant.tagline && <p className="opacity-70">{merchant.tagline}</p>}
      <GiftCardOffer merchant={merchant} product={getProducts(merchant.id)[0]} />
    </main>
  );
}

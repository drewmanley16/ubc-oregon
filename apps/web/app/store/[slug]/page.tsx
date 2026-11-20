// LANE D. Store page (prototype "store"): the card, the price, the safety note, one button.
import { notFound } from "next/navigation";
import { getMerchantBySlug, getProducts } from "@/server/seed";
import { GiftCardOffer } from "./offer";

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) notFound();
  return <GiftCardOffer merchant={merchant} product={getProducts(merchant.id)[0]} />;
}

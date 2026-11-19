// LANE C (backend). Demo catalog. Fictional merchants only — no real retailer names or logos.
// merchant.id MUST equal the on-chain merchantId registered by Deploy.s.sol.
import type { Merchant, Product } from "@sway/shared";

export const MERCHANTS: Merchant[] = [
  { id: 1, slug: "daybreak-coffee", name: "Daybreak Coffee", tagline: "Small-batch roasts, big mornings", creditTokenId: "1", accentColor: "#C8742B" },
  { id: 2, slug: "northline-apparel", name: "Northline Apparel", tagline: "Built for the long way home", creditTokenId: "2", accentColor: "#2F4A5A" },
  { id: 3, slug: "parkside-market", name: "Parkside Market", tagline: "Your neighborhood grocer", creditTokenId: "3", accentColor: "#3E7B4F" },
];

// Sway sells store GIFT CARDS. One $100 eGift card product per store; its price is face value and
// the Sway discount comes from on-chain listings (quote). $100 == the demo card face value.
export const PRODUCTS: Product[] = [
  { id: "dbc-gc-100", merchantId: 1, name: "Daybreak Coffee $100 gift card", description: "Use in store or online", priceCents: "10000" },
  { id: "nla-gc-100", merchantId: 2, name: "Northline Apparel $100 gift card", description: "Use in store or online", priceCents: "10000" },
  { id: "pkm-gc-100", merchantId: 3, name: "Parkside Market $100 gift card", description: "Use in store or online", priceCents: "10000" },
];

export const getMerchantById = (id: number) => MERCHANTS.find((m) => m.id === id);
export const getMerchantBySlug = (slug: string) => MERCHANTS.find((m) => m.slug === slug);
export const getProducts = (merchantId: number) => PRODUCTS.filter((p) => p.merchantId === merchantId);

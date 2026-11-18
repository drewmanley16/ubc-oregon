// LANE C (backend). Demo catalog. Fictional merchants only — no real retailer names or logos.
// merchant.id MUST equal the on-chain merchantId registered by Deploy.s.sol.
import type { Merchant, Product } from "@sway/shared";

export const MERCHANTS: Merchant[] = [
  { id: 1, slug: "daybreak-coffee", name: "Daybreak Coffee", tagline: "Small-batch roasts, big mornings", creditTokenId: "1", accentColor: "#C8742B" },
  { id: 2, slug: "northline-apparel", name: "Northline Apparel", tagline: "Built for the long way home", creditTokenId: "2", accentColor: "#2F4A5A" },
  { id: 3, slug: "parkside-market", name: "Parkside Market", tagline: "Your neighborhood grocer", creditTokenId: "3", accentColor: "#3E7B4F" },
];

// Demo carts are designed to total exactly $100.00 so the seeded $100 listing is an exact cover.
export const PRODUCTS: Product[] = [
  { id: "dbc-beans-sub", merchantId: 1, name: "Roaster's Choice — 3-month beans subscription", priceCents: "7200" },
  { id: "dbc-pourover", merchantId: 1, name: "Ceramic pour-over set", priceCents: "2800" },
  { id: "nla-shell", merchantId: 2, name: "Ridgeline rain shell", priceCents: "8500" },
  { id: "nla-beanie", merchantId: 2, name: "Merino beanie", priceCents: "1500" },
  { id: "pkm-box", merchantId: 3, name: "Weekly produce box", priceCents: "6400" },
  { id: "pkm-pantry", merchantId: 3, name: "Pantry staples bundle", priceCents: "3600" },
];

export const getMerchantById = (id: number) => MERCHANTS.find((m) => m.id === id);
export const getMerchantBySlug = (slug: string) => MERCHANTS.find((m) => m.slug === slug);
export const getProducts = (merchantId: number) => PRODUCTS.filter((p) => p.merchantId === merchantId);

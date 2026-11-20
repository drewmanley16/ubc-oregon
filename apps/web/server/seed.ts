// LANE C (backend). Demo catalog. FICTIONAL stores only — no real retailer names or logos (AGENTS.md rule 7).
// merchant.id MUST equal an on-chain merchantId registered on MerchantCredit (ids 1-12 registered on Arc, 88/85 rates).
// One $1 eGift card product per store (demo-sized so faucet balances cover many buys). Must equal DEMO_FACE_CENTS.
import type { Merchant, Product } from "@sway/shared";

export const MERCHANTS: Merchant[] = [
  { id: 1, slug: "daybreak-coffee", name: "Daybreak Coffee", creditTokenId: "1", accentColor: "#C8742B" },
  { id: 2, slug: "northline-apparel", name: "Northline Apparel", creditTokenId: "2", accentColor: "#2F4A5A" },
  { id: 3, slug: "parkside-market", name: "Parkside Market", creditTokenId: "3", accentColor: "#3E7B4F" },
  { id: 4, slug: "lumen-electronics", name: "Lumen Electronics", creditTokenId: "4", accentColor: "#1F2937" },
  { id: 5, slug: "harbor-and-pine", name: "Harbor & Pine Home", creditTokenId: "5", accentColor: "#8B6B4A" },
  { id: 6, slug: "velocity-sports", name: "Velocity Sports", creditTokenId: "6", accentColor: "#C2410C" },
  { id: 7, slug: "nimbus-air", name: "Nimbus Air", creditTokenId: "7", accentColor: "#2563EB" },
  { id: 8, slug: "cinder-pizza", name: "Cinder Pizza Co.", creditTokenId: "8", accentColor: "#B91C1C" },
  { id: 9, slug: "atlas-books", name: "Atlas Books", creditTokenId: "9", accentColor: "#4D5B3A" },
  { id: 10, slug: "orbit-cinemas", name: "Orbit Cinemas", creditTokenId: "10", accentColor: "#6D28D9" },
  { id: 11, slug: "bloom-beauty", name: "Bloom Beauty", creditTokenId: "11", accentColor: "#BE185D" },
  { id: 12, slug: "kite-rides", name: "Kite Rides", creditTokenId: "12", accentColor: "#0F766E" },
];

export const PRODUCTS: Product[] = [
  { id: "dbc-gc-1", merchantId: 1, name: "Daybreak Coffee $1 gift card", priceCents: "100" },
  { id: "nla-gc-1", merchantId: 2, name: "Northline Apparel $1 gift card", priceCents: "100" },
  { id: "pkm-gc-1", merchantId: 3, name: "Parkside Market $1 gift card", priceCents: "100" },
  { id: "lum-gc-1", merchantId: 4, name: "Lumen Electronics $1 gift card", priceCents: "100" },
  { id: "hnp-gc-1", merchantId: 5, name: "Harbor & Pine Home $1 gift card", priceCents: "100" },
  { id: "vel-gc-1", merchantId: 6, name: "Velocity Sports $1 gift card", priceCents: "100" },
  { id: "nim-gc-1", merchantId: 7, name: "Nimbus Air $1 gift card", priceCents: "100" },
  { id: "cin-gc-1", merchantId: 8, name: "Cinder Pizza Co. $1 gift card", priceCents: "100" },
  { id: "atl-gc-1", merchantId: 9, name: "Atlas Books $1 gift card", priceCents: "100" },
  { id: "orb-gc-1", merchantId: 10, name: "Orbit Cinemas $1 gift card", priceCents: "100" },
  { id: "blm-gc-1", merchantId: 11, name: "Bloom Beauty $1 gift card", priceCents: "100" },
  { id: "kit-gc-1", merchantId: 12, name: "Kite Rides $1 gift card", priceCents: "100" },
];

export const getMerchantById = (id: number) => MERCHANTS.find((m) => m.id === id);
export const getMerchantBySlug = (slug: string) => MERCHANTS.find((m) => m.slug === slug);
export const getProducts = (merchantId: number) => PRODUCTS.filter((p) => p.merchantId === merchantId);

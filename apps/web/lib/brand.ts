// Visual identity for the fictional demo stores (from lane A's prototype). Keyed by merchant id.
export type Brand = { color: string; c1: string; c2: string; gift: string };
const BRANDS: Record<number, Brand> = {
  1: { color: "#C8742B", c1: "#D9883F", c2: "#8E4714", gift: "A gift for good mornings" },
  2: { color: "#2F4A5A", c1: "#46677B", c2: "#1C2F3B", gift: "A gift for the long way home" },
  3: { color: "#3E7B4F", c1: "#559A67", c2: "#24533A", gift: "A gift for the week ahead" },
};
export const brandOf = (merchantId: number): Brand => BRANDS[merchantId] ?? BRANDS[1];

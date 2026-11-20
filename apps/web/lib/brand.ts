// Visual identity for the fictional demo stores. Keyed by merchant id.
export type Brand = { color: string; c1: string; c2: string; gift: string };
const BRANDS: Record<number, Brand> = {
  1: { color: "#C8742B", c1: "#D9883F", c2: "#8E4714", gift: "" },
  2: { color: "#2F4A5A", c1: "#46677B", c2: "#1C2F3B", gift: "" },
  3: { color: "#3E7B4F", c1: "#559A67", c2: "#24533A", gift: "" },
  4: { color: "#1F2937", c1: "#374151", c2: "#0B0F14", gift: "" },
  5: { color: "#8B6B4A", c1: "#A9876A", c2: "#5E4530", gift: "" },
  6: { color: "#C2410C", c1: "#EA580C", c2: "#7C2D12", gift: "" },
  7: { color: "#2563EB", c1: "#3B82F6", c2: "#1E3A8A", gift: "" },
  8: { color: "#B91C1C", c1: "#DC2626", c2: "#7F1D1D", gift: "" },
  9: { color: "#4D5B3A", c1: "#6B7C52", c2: "#2F3923", gift: "" },
  10: { color: "#6D28D9", c1: "#7C3AED", c2: "#3B0764", gift: "" },
  11: { color: "#BE185D", c1: "#DB2777", c2: "#831843", gift: "" },
  12: { color: "#0F766E", c1: "#14B8A6", c2: "#134E4A", gift: "" },
};
export const brandOf = (merchantId: number): Brand => BRANDS[merchantId] ?? BRANDS[1];

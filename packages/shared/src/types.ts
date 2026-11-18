// FROZEN CROSS-LANE API TYPES (spec §6). Backend (lane C) produces these; web (lane D) consumes them.
// Rule: every money amount is a DECIMAL INTEGER STRING. Never a JS number, never a float.
//   *Cents      -> merchant credit / fiat face value in cents ("10000" = $100.00)
//   *UsdcUnits  -> ERC-20 USDC base units at the token's decimals ("88000000" = 88 USDC @ 6dp)

export type Hex = `0x${string}`;
export type Address = `0x${string}`;
export type IntString = string;

export type Merchant = {
  id: number; // == on-chain merchantId == ERC-1155 tokenId
  slug: string;
  name: string;
  tagline?: string;
  imageUrl?: string;
  accentColor?: string;
  creditTokenId: string;
};

export type Product = {
  id: string;
  merchantId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: IntString;
};

export type ListingStatus = "ACTIVE" | "FILLED" | "CANCELLED";

export type MarketplaceListing = {
  listingId: string;
  merchantId: number;
  sellerAddress: Address;
  faceValueCents: IntString;
  askUsdcUnits: IntString;
  status: ListingStatus;
  txHash: Hex; // tx that created the listing
};

export type CheckoutQuote = {
  quoteId: string; // ephemeral correlation only
  merchantId: number;
  orderId: Hex; // random bytes32
  listingId: string;
  faceValueCents: IntString;
  askUsdcUnits: IntString;
  grossSavingsCents: IntString; // face - ask(converted to cents), before gas
  currency: "USDC";
  chainId: number;
  expiresAt: string; // ISO; UI freshness indicator only, NOT enforced on-chain
  executable: boolean;
};

/** Returned when no exact-cover listing exists. Never fabricate an offer. */
export type NoQuote = {
  executable: false;
  reason: "NO_LISTING" | "MERCHANT_UNKNOWN" | "CHAIN_UNAVAILABLE";
  message: string;
};

export type QuoteResponse = CheckoutQuote | NoQuote;

export type CartLine = { productId: string; quantity: number };

export type CreateOrderRequest = {
  merchantId: number;
  lines: CartLine[];
};

/** Order = signed, stateless token (no DB). `token` is HMAC-signed by ORDER_SIGNING_SECRET. */
export type Order = {
  orderId: Hex;
  merchantId: number;
  lines: (CartLine & { priceCents: IntString; name: string })[];
  totalCents: IntString;
  createdAt: string;
  token: string;
};

export type OrderStatus =
  | { state: "UNPAID"; order: Omit<Order, "token"> }
  | { state: "PAID"; order: Omit<Order, "token">; receipt: CheckoutReceipt };

/** Built ONLY from a confirmed CheckoutCompleted event. Never from client claims. */
export type CheckoutReceipt = {
  orderId: Hex;
  merchantId: number;
  buyer: Address;
  seller: Address;
  listingId: string;
  creditCents: IntString;
  usdcUnits: IntString;
  grossSavingsCents: IntString;
  txHash: Hex;
  blockNumber: IntString;
  explorerUrl: string;
};

export type ApiError = { error: { code: string; message: string } };

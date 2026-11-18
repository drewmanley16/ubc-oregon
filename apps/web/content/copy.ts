// LANE A (UX) owns. ALL user-facing strings live here. Components import from this file;
// never hard-code microcopy in JSX. Rule: lead with savings, not crypto (spec §1).
// Placeholders below are first drafts — lane A should rewrite/expand freely.

export const copy = {
  brand: { name: "Sway", tagline: "Pay less at checkout. Automatically." },
  landing: {
    headline: "Your $100 order. $88 with Sway.",
    sub: "Sway finds discounted store credit from other shoppers and applies it at checkout in one tap.",
    demoBadge: "Demo — fictional stores, testnet funds",
  },
  checkout: {
    title: "Checkout",
    savingsLine: (savings: string) => `Save ${savings} with Sway`,
    youPay: "You pay",
    orderTotal: "Order total",
    creditApplied: "Store credit applied",
    sourceListing: "From a verified credit listing",
    quoteExpires: (secs: number) => `Price held for ${secs}s`,
    quoteStale: "Prices may have changed. Refresh to see the latest offer.",
    noOffer: "No savings available right now. Check back soon.",
    cta: { signIn: "Sign in to pay", approve: "Enable payment", pay: (amt: string) => `Pay ${amt}`, refresh: "Refresh price" },
  },
  tx: {
    approving: "Enabling payment…",
    awaitingSignature: "Confirm in your wallet",
    pending: "Processing your payment…",
    confirmed: "Payment complete",
    rejected: "Payment cancelled. Nothing was charged.",
    failed: "Payment didn't go through. You haven't been charged.",
    wrongNetwork: "Switch to Arc to continue",
    insufficientFunds: "Not enough USDC for this order",
  },
  receipt: {
    title: "You saved",
    retailValue: "Retail value",
    paid: "You paid",
    sellerPaid: "Paid to credit seller",
    creditRedeemed: "Store credit redeemed",
    viewOnExplorer: "View transaction",
  },
  sell: { title: "Sell store credit", empty: "You don't have any store credit yet." },
  merchant: { title: "Merchant console", issue: "Issue demo credit" },
  disclaimer:
    "Sway is a hackathon prototype on Arc testnet. All merchants and credit are fictional and have no real-world value.",
} as const;

// LANE A (UX) owns. ALL user-facing strings live here. Components import from this file;
// never hard-code microcopy in JSX.
//
// Voice rules (docs/ux/prototype.html, "Design system v0"):
// - Lead with money saved. One number gets the spotlight per screen.
// - Buttons say exactly what happens and how much: "Pay $88", never "Continue".
// - Errors say what happened, "you weren't charged" ONLY when that is true, and what to do next.
// - No crypto words in the main UI: no wallet, USDC, gas, token, transaction, network names.
//   Users "Sign in". The explorer link is the one place "Arc" appears, as proof.
// - Never imply real shops or real value.
//
// Key names and function signatures that lane D's code already uses are unchanged.
// New keys still need wiring: see "Copy wiring" in docs/STATUS.md.

/** 75 -> "1:15". Used for the price hold countdown. */
const clock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const copy = {
  brand: { name: "Sway", tagline: "Pay less at checkout. Automatically." },

  landing: {
    headline: "Your $100 order. $88 with Sway.",
    sub: "Sway finds unused store credit other shoppers are selling and puts it on your order automatically.",
    demoBadge: "Demo: fictional shops, test money",
    shopDeal: (savings: string) => `Save ${savings} on your order today`,
    shopNoDeal: "No deals right now",
  },

  store: {
    total: "Total",
    checkout: (total: string) => `Check out · ${total}`,
    checkoutPlain: "Check out",
    startingCheckout: "Starting checkout…",
    savingsHint: "Sway will lower your price at checkout",
    error: "Couldn't start checkout. Try again.",
  },

  account: {
    signIn: "Sign in",
    signOut: "Sign out",
    signedInAs: (label: string) => `Signed in as ${label}`,
  },

  checkout: {
    title: "Checkout",
    yourTotal: "Your total",
    savingsLine: (savings: string) => `You save ${savings} with Sway`,
    youPay: "You pay",
    orderTotal: "Order total",
    creditApplied: "Store credit discount",
    feeIncluded: (fee: string) => `Includes ${fee} Sway service fee`,
    priceDetails: "Price details",
    sourceListing: "Covered by store credit another shopper is selling",
    finding: "Finding you a better price",
    quoteExpires: (secs: number) => `Price held for ${clock(secs)}`,
    quoteStale: "This price expired. Store credit prices can change, so refresh to get the latest.",
    noOffer: "No deal for this order right now. Check back soon, or pay full price at the shop.",
    twoConfirmations: "Paying takes two quick confirmations: one to allow the payment, one to pay.",
    cta: {
      signIn: "Sign in to pay",
      signInToPay: (amt: string) => `Sign in to pay ${amt}`,
      approve: "Enable payment",
      pay: (amt: string) => `Pay ${amt}`,
      payFallback: "Pay",
      refresh: "Refresh price",
      retry: "Try again",
      findAnother: "Find another price",
      backToStore: "Back to store",
    },
  },

  // One status line per CheckoutPhase (apps/web/lib/tx/types.ts). TxProgress should render these,
  // not the raw phase name.
  tx: {
    loadingQuote: "Finding you a better price",
    signedOut: "Sign in to see your price and pay",
    needsApproval: "Paying takes two quick confirmations",
    ready: "Ready when you are",
    approving: "Allowing this payment…",
    awaitingSignature: "Confirm in the pop-up to continue",
    pending: "Paying…",
    confirmed: "Paid",
    rejected: "Payment cancelled. You weren't charged.",
    failed: "Payment didn't go through. You weren't charged.",
    failedTaken: "This deal was just taken. You weren't charged.",
    wrongNetwork: "Switch to continue",
    insufficientFunds: "Not enough in your balance",
    insufficientFundsDetail: (need: string, have: string) => `You need ${need}. Your balance is ${have}.`,
    notDeployed: "Checkout isn't available right now. Try again soon.",
    confirmingReceipt: "Confirming your payment…",
  },

  receipt: {
    title: "You saved",
    summary: (paid: string, total: string, shop: string) => `Paid ${paid} for your ${total} ${shop} order.`,
    retailValue: "Order total",
    paid: "You paid",
    sellerPaid: "Paid to the credit seller",
    swayFee: "Sway service fee (included)",
    creditRedeemed: "Store credit used",
    coveredBy: (amt: string, shop: string) => `${amt} of ${shop} store credit`,
    sellerTiming: "Paid at the same moment",
    order: "Order",
    viewOnExplorer: "View proof on Arc",
    backToShops: "Back to shops",
  },

  errors: {
    missingOrderToken: "This checkout link is incomplete. Start again from the store.",
    missingReceiptToken: "This receipt link is incomplete. Open it again from your checkout.",
    orderLoad: "We couldn't load this order. Refresh the page to try again.",
  },

  sell: {
    title: "Turn store credit into cash",
    sub: "List store credit you won't use. You get paid the moment someone checks out with it.",
    empty: "You don't have any store credit yet.",
    demoTag: "Demo credit",
    balance: (amt: string, shop: string) => `${amt} of ${shop} store credit`,
    payoutPreview: (payout: string, savings: string) => `You get ${payout} when it sells. Shoppers save ${savings}.`,
    list: (payout: string) => `List it and get ${payout}`,
    allowHold: "Allow Sway to hold your credit",
    allowHoldHelp: "Your credit stays locked with Sway until it sells or you cancel. You only allow this once.",
    listed: "Listed. Your credit is locked until it sells or you cancel.",
    status: { active: "Waiting for a buyer", sold: "Sold", cancelled: "Cancelled" },
    cancel: "Cancel listing",
    cancelDone: "Listing cancelled. Your credit is back in your account.",
    proceeds: (amt: string) => `+${amt} received`,
  },

  merchant: {
    title: "Merchant console",
    issue: "Issue demo credit",
    issueTo: "Give credit to",
    amount: "Amount",
    issueCta: (amt: string) => `Issue ${amt} credit`,
    issued: (amt: string, who: string) => `${amt} of demo credit issued to ${who}.`,
    totals: { issued: "Issued", redeemed: "Redeemed", outstanding: "Outstanding" },
    sales: "Paid orders",
    notIssuer: (shop: string) => `This account can't issue credit for ${shop}.`,
  },

  disclaimer:
    "Sway is a hackathon prototype on Arc testnet. All shops and credit are fictional and have no real-world value.",
} as const;

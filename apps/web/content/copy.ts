// LANE A (UX) owns. ALL user-facing strings live here. Components import from this file;
// never hard-code microcopy in JSX.
//
// Matches the approved prototype: docs/ux/prototype.html (Nov 19).
//
// Voice rules (docs/ux/prototype.html, "Design system v0"):
// - Lead with money saved. One number gets the spotlight per screen.
// - Buttons say exactly what happens and how much: "Hold to pay $88", never "Continue".
// - One honest total: the Sway fee is inside the price and shown in details and on the receipt.
// - Errors say what happened, "you weren't charged" ONLY when that is true, and what to do next.
// - No crypto words in the main UI: no wallet, USDC, gas, token, transaction.
//   Users "Sign in". Arc is named once, in the footer, plus the raw-record link.
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
    demoBadge: "Demo: fictional shops and test money.",
    shopDeal: (savings: string, total: string) => `Save ${savings} on your ${total} order`,
    shopNoDeal: "No deals right now",
  },

  footer: {
    ledger: "Payments are recorded on Arc, a public ledger.",
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

  signIn: {
    toPay: (amt: string) => `Sign in to pay ${amt}`,
    toSell: "Sign in to sell",
    reassure: "No password, no app to download.",
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
    hold: {
      keepHolding: "Keep holding…",
      releasedEarly: "Hold the button for a second to pay",
      altConfirm: "Can't hold? Tap to confirm instead",
    },
    confirmSheet: {
      title: "Confirm payment",
      body: (total: string, shop: string) => `For your ${total} ${shop} order. This can't be undone.`,
    },
    cta: {
      signIn: "Sign in to pay",
      signInToPay: (amt: string) => `Sign in to pay ${amt}`,
      holdToPay: (amt: string) => `Hold to pay ${amt}`,
      approve: "Enable payment",
      pay: (amt: string) => `Pay ${amt}`,
      payFallback: "Pay",
      refresh: "Refresh price",
      retry: "Try again",
      checkAgain: "Check again",
      findAnother: "Find another price",
      backToStore: "Back to store",
      cancel: "Cancel",
    },
  },

  // One status line per CheckoutPhase (apps/web/lib/tx/types.ts). TxProgress should render these,
  // not the raw phase name. There are no pop-ups (Privy showWalletUIs: false), so one hold runs
  // approving -> pending -> confirmed with no extra input from the shopper.
  tx: {
    loadingQuote: "Finding you a better price",
    signedOut: "Sign in to see your price and pay",
    needsApproval: "Ready when you are",
    ready: "Ready when you are",
    approving: "Allowing this payment…",
    awaitingSignature: "Paying…",
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
    sellerPaid: "Credit seller",
    sellerTiming: "Paid at the same moment",
    swayFee: "Sway service fee",
    swayFeeIncluded: (fee: string) => `${fee} (included)`,
    creditRedeemed: "Covered by",
    coveredBy: (amt: string, shop: string) => `${amt} of ${shop} store credit`,
    order: "Order",
    viewOnExplorer: "View payment record",
    backToShops: "Back to shops",
  },

  record: {
    title: "Payment record",
    intro: "A permanent public record of this payment. Nobody can edit it, including Sway.",
    paid: "You paid",
    creditUsed: "Store credit used",
    sellerPaid: "Paid to the credit seller",
    fee: "Sway service fee",
    recorded: "Recorded",
    openRaw: "Open the raw record on Arc",
  },

  errors: {
    missingOrderToken: "This checkout link is incomplete. Start again from the store.",
    missingReceiptToken: "This receipt link is incomplete. Open it again from your checkout.",
    orderLoad: "We couldn't load this order. Refresh the page to try again.",
  },

  sell: {
    title: "Turn store credit into cash.",
    sub: "List store credit you won't use. You get paid the moment a shopper checks out with it.",
    noDrainTitle: "Can't be drained",
    noDrainBody:
      "Your credit is locked with Sway while it's listed, then used up in the same moment you're paid. Nobody can spend it twice.",
    yourCredit: "Your store credit",
    yourCreditSub: "Credit shops have given you. Sell what you won't use.",
    empty: "You don't have any store credit yet.",
    demoTag: "Demo credit",
    balance: (amt: string, shop: string) => `${amt} of ${shop} store credit`,
    sellNow: (payout: string) => `Sell now, get ${payout}`,
    sellCta: "Sell",
    youGetWhenSold: "You get when it sells",
    split: { shoppersPay: "Shoppers pay", fee: "Sway service fee", youGet: "You get" },
    whyTitle: (payout: string) => `Why ${payout}?`,
    whyBody: (shop: string) =>
      `Sway sets one price for all ${shop} credit, at or above what gift card resale sites pay. No haggling, and shoppers always see one clear price.`,
    firstTimeTitle: "First time only",
    firstTimeBody: "Sway will hold your credit until it sells or you cancel. You can cancel any time.",
    list: (payout: string) => `List it and get ${payout}`,
    locking: "Locking your credit…",
    listedTitle: "Listed.",
    listed: (payout: string) => `Your credit is locked until it sells or you cancel. You'll get ${payout} the moment a shopper uses it.`,
    status: { active: "Waiting for a buyer", sold: "Sold", cancelled: "Cancelled" },
    cancel: "Cancel listing",
    cancelDone: (amt: string, shop: string) => `Listing cancelled. Your ${amt} of ${shop} credit is back in your account.`,
    soldTitle: "Your credit sold.",
    soldSub: "A shopper checked out with it. The money is already yours.",
    received: "Received",
    proceeds: (amt: string) => `+${amt}`,
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

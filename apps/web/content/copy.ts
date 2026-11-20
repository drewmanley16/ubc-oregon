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
//
// Nov 19 merge (lane D): product is now GIFT CARDS (sell a card -> we swap it to a new number -> buyer
// gets the new number). landing/store/sell were rewritten for that, and card/balance added, in the voice
// rules above. Lane A: reword freely; keep the key names/signatures (code uses them).

/** 75 -> "1:15". Used for the price hold countdown. */
const clock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const copy = {
  brand: { name: "Sway", tagline: "Gift cards you can trust. Cash for the ones you won't use." },

  landing: {
    headline: "A $100 gift card. $88 with Sway.",
    sub: "Buy gift cards other people won't use, for less. Or sell yours and get paid in a minute.",
    demoBadge: "Demo: fictional shops, test money",
    buyCta: "Shop gift cards",
    sellCta: "Sell a gift card",
    howTitle: "Why you can't get a used-up card",
    how: [
      "When someone sells a card, Sway moves its balance to a brand-new card number. Their old number drops to $0.",
      "Only you see the new number and PIN, right after you pay.",
      "The seller is paid at the same moment you pay.",
    ],
    shopDeal: (savings: string) => `Save ${savings} on your order today`,
    shopNoDeal: "No deals right now",
  },

  store: {
    giftCard: "Gift card",
    withSway: (amt: string) => `${amt} with Sway`,
    youSave: (amt: string) => `You save ${amt}`,
    noOffer: "No discounted cards for this shop right now. Check back soon.",
    buy: "Buy gift card",
    starting: "Starting checkout…",
    checking: "Finding you a better price",
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
    creditApplied: "Gift card discount",
    feeIncluded: (fee: string) => `Includes ${fee} Sway service fee`,
    priceDetails: "Price details",
    sourceListing: "A checked card that can't be used up before you get it",
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
    title: "Sell a gift card",
    sub: "Got a card you won't use? Get paid the moment someone buys it.",
    store: "Shop",
    number: "Card number",
    pin: "PIN",
    noCard: "No card handy?",
    getDemo: "Get a demo $100 card",
    demoIssued: "Here's a demo $100 card from the shop. We filled it in for you.",
    payout: (amt: string) => `You get ${amt} when it sells`,
    signIn: "Sign in to sell",
    submit: "Check and list my card",
    verifying: "Checking your card with the shop…",
    verified: (amt: string) => `Checked: ${amt} on the card`,
    swapped: (last4: string) => `Moved to a new card number. Your card ending ${last4} is now $0, so it can't be spent twice.`,
    approving: "Allowing Sway to hold your card while it's listed…",
    listing: "Listing your card…",
    listed: "Listed. You'll be paid automatically when it sells.",
    rejected: "You cancelled in the pop-up. Your card's value is safe in your account, so you can list it again.",
    retryList: "List my card",
    checkOld: "Check your old card's balance",
    gasCovered: "Sway covered the small processing cost for you.",
    mintTx: "View proof on Arc",
    // Earlier drafts (not wired yet):
    empty: "You don't have any cards to sell yet.",
    status: { active: "Waiting for a buyer", sold: "Sold", cancelled: "Cancelled" },
    cancel: "Cancel listing",
    cancelDone: "Listing cancelled. The card's value is back in your account.",
    proceeds: (amt: string) => `+${amt} received`,
  },

  card: {
    title: "Your gift card",
    reveal: "Show my gift card",
    revealing: "Confirm it's you in the pop-up…",
    revealHint: "You'll confirm once to prove you're the buyer. It's free.",
    number: "Card number",
    pin: "PIN",
    balance: "Balance",
    checkBalance: "Check balance at the shop",
    simulated: "Demo card from a pretend shop. In real life this comes from the shop's own gift card system.",
  },

  balance: {
    title: "Gift card balance",
    sub: "Pretend balance checker for the demo shops.",
    check: "Check balance",
    swappedOut: "This card was sold on Sway. Its balance moved to a new card number.",
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
    "Sway is a hackathon prototype on Arc testnet. All shops and gift cards are fictional and have no real-world value.",
} as const;

// LANE A (UX) owns. ALL user-facing strings live here. Components import from this file;
// never hard-code microcopy in JSX.
//
// Product (Nov 19): GIFT CARDS. A seller's card is checked, its value moves to a new card number only Sway
// knows (old number drops to $0), and the buyer gets the new number after paying. The shops' card
// system is simulated; always say so.
//
// Voice rules (docs/ux/prototype.html, "Design system v0"):
// - Lead with money saved. One number gets the spotlight per screen.
// - Buttons say exactly what happens and how much: "Hold to pay $88", never "Continue".
// - One honest total: the Sway fee is inside the price and shown in details and on the receipt.
// - Errors say what happened, "you weren't charged" ONLY when that is true, and what to do next.
// - No crypto words in the main UI: no wallet, USDC, gas, token, transaction.
//   Users "Sign in". Arc is named in the footer; links say "record", not "proof on Arc".
// - There are no pop-ups (Privy showWalletUIs: false), so copy never says "confirm in the pop-up".
// - Never imply real shops or real value.
//
// Key names and function signatures that lane D's code uses are unchanged.
// New keys still need wiring: see "Copy wiring" in docs/STATUS.md.

/** 75 -> "1:15". Used for the price hold countdown. */
const clock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const copy = {
  brand: { name: "Sway", tagline: "Gift cards you can trust. Cash for the ones you won't use." },

  landing: {
    headline: "A $10 gift card. $8.80 with Sway.",
    sub: "Buy gift cards other people won't use, for less. Or sell yours and get paid the moment it sells.",
    demoBadge: "Demo · fictional shops · test money",
    buyCta: "Shop gift cards",
    sellCta: "Sell a gift card",
    howTitle: "Why you can't get a used-up card",
    how: [
      "When someone sells a card, Sway moves its balance to a brand-new card number. Their old number drops to $0.",
      "Only you see the new number and PIN, right after you pay.",
      "The seller is paid at the same moment you pay.",
    ],
    shopDeal: (savings: string) => `Save ${savings} on a $10 gift card`,
    shopNoDeal: "No deals right now",
  },

  footer: {
    ledger: "Payments are recorded on Arc, a public ledger.",
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
    orderTotal: "Card value",
    creditApplied: "Gift card discount",
    feeIncluded: (fee: string) => `Includes ${fee} Sway service fee`,
    priceDetails: "Price details",
    sourceListing: "A checked card that can't be used up before you get it",
    finding: "Finding you a better price",
    quoteExpires: (secs: number) => `Price held for ${clock(secs)}`,
    quoteStale: "This price expired. Gift card prices can change, so refresh to get the latest.",
    noOffer: "No discounted card for this order right now. Check back soon.",
    hold: {
      keepHolding: "Keep holding…",
      releasedEarly: "Hold the button for a second to pay",
      altConfirm: "Can't hold? Tap to confirm instead",
    },
    confirmSheet: {
      title: "Confirm payment",
      body: (total: string, shop: string) => `For a ${total} ${shop} gift card. This can't be undone.`,
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
      findAnother: "Find another card",
      backToStore: "Back to shop",
      cancel: "Cancel",
    },
  },

  // One status line per CheckoutPhase (apps/web/lib/tx/types.ts). TxProgress should render these,
  // not the raw phase name. No pop-ups, so one tap or hold runs approving -> pending -> confirmed.
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
    failedTaken: "This card was just bought by someone else. You weren't charged.",
    wrongNetwork: "Switch to continue",
    insufficientFunds: "Not enough in your balance",
    insufficientFundsDetail: (need: string, have: string) => `You need ${need}. Your balance is ${have}.`,
    notDeployed: "Checkout isn't available right now. Try again soon.",
    confirmingReceipt: "Confirming your payment…",
  },

  receipt: {
    title: "You saved",
    summary: (paid: string, total: string, shop: string) => `Paid ${paid} for a ${total} ${shop} gift card.`,
    retailValue: "Card value",
    paid: "You paid",
    sellerPaid: "Card seller",
    sellerTiming: "Paid at the same moment",
    swayFee: "Sway service fee",
    swayFeeIncluded: (fee: string) => `${fee} (included)`,
    creditRedeemed: "Card value used",
    coveredBy: (amt: string, shop: string) => `${amt} ${shop} gift card`,
    order: "Order",
    viewOnExplorer: "View payment record",
    backToShops: "Back to shops",
  },

  record: {
    title: "Payment record",
    intro: "A permanent public record of this payment. Nobody can edit it, including Sway.",
    paid: "You paid",
    creditUsed: "Gift card bought",
    sellerPaid: "Paid to the card seller",
    fee: "Sway service fee",
    recorded: "Recorded",
    openRaw: "Open the raw record on Arc",
  },

  errors: {
    missingOrderToken: "This checkout link is incomplete. Start again from the shop.",
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
    getDemo: "Get a demo $10 card",
    demoIssued: "Here's a demo $10 card from the shop. We filled it in for you.",
    payout: (amt: string) => `You get ${amt} when it sells`,
    signIn: "Sign in to sell",
    submit: "Check and list my card",
    verifying: "Checking your card with the shop…",
    verified: (amt: string) => `Checked: ${amt} on the card`,
    swapped: (last4: string) => `Moved to a new card number. Your card ending ${last4} is now $0, so it can't be spent twice.`,
    approving: "Allowing Sway to hold your card while it's listed…",
    listing: "Listing your card…",
    listed: "Listed. You'll be paid automatically when it sells.",
    rejected: "Listing didn't finish. Your card's value is safe in your account, so you can list it again.",
    retryList: "List my card",
    checkOld: "Check your old card's balance",
    gasCovered: "Sway covered the small processing cost for you.",
    mintTx: "View the record",
    noDrainTitle: "Can't be drained",
    noDrainBody:
      "Your card's value moves to a new number only Sway knows, then goes to the buyer the moment you're paid. Nobody can spend it twice.",
    whyTitle: (payout: string) => `Why ${payout}?`,
    whyBody: (shop: string) =>
      `Sway sets one price for every ${shop} card, at or above what gift card resale sites pay. No haggling, and buyers always see one clear price.`,
    split: { buyersPay: "Buyers pay", fee: "Sway service fee", youGet: "You get" },
    // Not wired yet:
    empty: "You don't have any cards to sell yet.",
    status: { active: "Waiting for a buyer", sold: "Sold", cancelled: "Cancelled" },
    cancel: "Cancel listing",
    cancelDone: "Listing cancelled. The card's value is back in your account.",
    soldTitle: "Your card sold.",
    soldSub: "A buyer paid for it. The money is already yours.",
    proceeds: (amt: string) => `+${amt} received`,
  },

  card: {
    title: "Your gift card",
    reveal: "Show my gift card",
    revealing: "Checking it's you…",
    revealHint: "We check it's really you before showing the number and PIN. It's free.",
    number: "Card number",
    pin: "PIN",
    balance: "Balance",
    checkBalance: "Check balance at the shop",
    simulated: "Simulated demo card",
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

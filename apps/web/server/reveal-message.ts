// LANE C. Shared between server verification and the client signer. Plain-English, no gas.
export const revealMessage = (orderId: string) =>
  `Sway: show my gift card\n\nOrder: ${orderId.toLowerCase()}\n\nSigning proves you're the buyer. It costs nothing.`;

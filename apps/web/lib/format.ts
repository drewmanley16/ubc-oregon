// Display helpers (no money math here — see @sway/shared money.ts).
export const groupCardNumber = (n: string) => n.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

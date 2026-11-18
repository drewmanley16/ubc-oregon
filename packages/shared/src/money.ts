// Integer-only money helpers. All inputs/outputs are bigint or decimal integer strings.

export const CENTS_PER_DOLLAR = 100n;

/** USDC base units -> cents. Throws if the conversion would lose precision (sub-cent remainder). */
export function usdcUnitsToCentsExact(units: bigint, decimals: number): bigint {
  if (decimals < 2) throw new Error("decimals < 2 unsupported");
  const divisor = 10n ** BigInt(decimals - 2);
  if (units % divisor !== 0n) throw new Error(`USDC amount ${units} has sub-cent precision`);
  return units / divisor;
}

export function centsToUsdcUnits(cents: bigint, decimals: number): bigint {
  if (decimals < 2) throw new Error("decimals < 2 unsupported");
  return cents * 10n ** BigInt(decimals - 2);
}

/** Gross savings before gas/fees (spec §4). May be negative if a listing is priced above face. */
export function grossSavingsCents(faceCents: bigint, askUsdcUnits: bigint, decimals: number): bigint {
  return faceCents - usdcUnitsToCentsExact(askUsdcUnits, decimals);
}

/** "10000" -> "$100.00". Display only. */
export function formatCents(cents: bigint | string): string {
  const c = BigInt(cents);
  const neg = c < 0n;
  const abs = neg ? -c : c;
  const dollars = abs / 100n;
  const rem = (abs % 100n).toString().padStart(2, "0");
  return `${neg ? "-" : ""}$${dollars.toLocaleString("en-US")}.${rem}`;
}

/** Parses a decimal integer string strictly. Rejects floats, signs, whitespace, empty. */
export function parseIntString(s: string): bigint {
  if (!/^\d+$/.test(s)) throw new Error(`not a decimal integer string: ${JSON.stringify(s)}`);
  return BigInt(s);
}

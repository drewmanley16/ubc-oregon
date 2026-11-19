// LANE C. Server-side signer acting as the (fictional) merchant's credit issuer.
// Key comes ONLY from server env MERCHANT_<id>_ISSUER_PRIVATE_KEY (never NEXT_PUBLIC_, never in git).
import "server-only";
import { createWalletClient, http, keccak256, parseEther, toHex, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, merchantCreditAbi } from "@sway/shared";
import { publicClient, requireDeployment } from "./chain.ts";

function issuerAccount(merchantId: number) {
  const pk = process.env[`MERCHANT_${merchantId}_ISSUER_PRIVATE_KEY`] ?? process.env.MERCHANT_1_ISSUER_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error(`MERCHANT_${merchantId}_ISSUER_PRIVATE_KEY is not configured.`);
  return privateKeyToAccount(pk as Hex);
}

function walletFor(merchantId: number) {
  return createWalletClient({
    account: issuerAccount(merchantId),
    chain: arcTestnet,
    transport: http(process.env.ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0]),
  });
}

/** Opaque memo so the on-chain record links to the sale without revealing card data. */
export const saleMemo = (saleId: string) => keccak256(toHex(`sway-sale:${saleId}`));

/** Mints `cents` of merchant credit to `to`. Resolves only after a SUCCESSFUL receipt. */
export async function mintCreditTo(merchantId: number, to: Address, cents: bigint, saleId: string) {
  const d = requireDeployment();
  const w = walletFor(merchantId);
  const onchainIssuer = await publicClient.readContract({
    address: d.merchantCredit,
    abi: merchantCreditAbi,
    functionName: "issuerOf",
    args: [BigInt(merchantId)],
  });
  if (onchainIssuer.toLowerCase() !== w.account.address.toLowerCase())
    throw new Error(`Server issuer key does not match on-chain issuer for merchant ${merchantId}.`);
  const hash = await w.writeContract({
    address: d.merchantCredit,
    abi: merchantCreditAbi,
    functionName: "mintCredit",
    args: [BigInt(merchantId), to, cents, saleMemo(saleId)],
  });
  const r = await publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`mintCredit reverted (${hash})`);
  return hash;
}

/** Gas top-up so a brand-new seller (no crypto) can sign their 2 listing txs. Arc gas is USDC. */
const GAS_FLOOR = parseEther("0.05"); // native view is 18-decimals
const GAS_DRIP = parseEther("0.2");

export async function ensureSellerGas(merchantId: number, seller: Address): Promise<Hex | null> {
  const bal = await publicClient.getBalance({ address: seller });
  if (bal >= GAS_FLOOR) return null;
  const w = walletFor(merchantId);
  const hash = await w.sendTransaction({ to: seller, value: GAS_DRIP });
  const r = await publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`gas top-up reverted (${hash})`);
  return hash;
}

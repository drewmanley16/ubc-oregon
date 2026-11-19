import { http } from "wagmi";
import { arcTestnet } from "@sway/shared";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
export const privyEnabled = PRIVY_APP_ID.length > 0;

export const wagmiChains = [arcTestnet] as const;
export const wagmiTransports = {
  [arcTestnet.id]: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || arcTestnet.rpcUrls.default.http[0]),
};

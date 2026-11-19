"use client";
// LANE D. Privy (email/Google/passkey → embedded wallet) + wagmi on Arc testnet.
// Without NEXT_PUBLIC_PRIVY_APP_ID the app still renders (sign-in is disabled with a clear message).
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyWagmiConfig } from "@privy-io/wagmi";
import { WagmiProvider, createConfig } from "wagmi";
import { arcTestnet } from "@sway/shared";
import { PRIVY_APP_ID, privyEnabled, wagmiChains, wagmiTransports } from "@/lib/wallet/config";

const privyWagmiConfig = createPrivyWagmiConfig({ chains: wagmiChains, transports: wagmiTransports, ssr: true });
const plainWagmiConfig = createConfig({ chains: wagmiChains, transports: wagmiTransports, ssr: true });

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());

  if (!privyEnabled) {
    return (
      <WagmiProvider config={plainWagmiConfig}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "passkey", "wallet"],
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          // Sway renders its own confirmation UI; no extra wallet popups for embedded wallets.
          showWalletUIs: false,
        },
        appearance: { theme: "light", walletChainType: "ethereum-only" },
      }}
    >
      <QueryClientProvider client={qc}>
        <PrivyWagmiProvider config={privyWagmiConfig}>{children}</PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

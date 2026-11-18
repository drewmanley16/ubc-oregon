"use client";
// LANE D owns. TODO(lane-D): wrap with <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}>
// and @privy-io/wagmi <WagmiProvider config={createConfig({ chains: [arcTestnet], transports: {...} })}>.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

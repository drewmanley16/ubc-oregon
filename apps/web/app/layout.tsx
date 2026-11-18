import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { DemoBanner } from "@/components/sway/DemoBanner";
import { copy } from "@/content/copy";

export const metadata: Metadata = {
  title: `${copy.brand.name} — ${copy.brand.tagline}`,
  description: copy.landing.sub,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <DemoBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

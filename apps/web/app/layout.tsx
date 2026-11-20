import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DemoBanner } from "@/components/sway/DemoBanner";
import { copy } from "@/content/copy";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: `${copy.brand.name} — ${copy.brand.tagline}`,
  description: copy.landing.sub,
  appleWebApp: { capable: true, title: "Sway", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F7F8F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>
        <Providers>
          <div className="app">
            <DemoBanner />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

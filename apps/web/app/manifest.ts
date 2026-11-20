// Installable on phones ("Add to Home Screen"): full-screen, Sway icon, light theme.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sway — gift cards you can trust",
    short_name: "Sway",
    description: "Buy discounted gift cards that can't be drained. Sell yours for cash.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F8F6",
    theme_color: "#F7F8F6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

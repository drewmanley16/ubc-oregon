import type { NextConfig } from "next";

// Styles are plain CSS (app/globals.css, design system v0). Tailwind's Turbopack loader was dropped
// because it emptied globals.css in Vercel production builds.
const nextConfig: NextConfig = {
  transpilePackages: ["@sway/shared"],
};

export default nextConfig;

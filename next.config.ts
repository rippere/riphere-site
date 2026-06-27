import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export → deploys to Cloudflare Pages / Netlify / GitHub Pages
  // with no server (output dir: `out`). Keeps the original zero-infra hosting story.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;

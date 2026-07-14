import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Hide the floating Next.js "N" badge in `next dev` (screenshots / marketing).
  devIndicators: false,
  // Allow loading the dev server via these hosts (HMR + font dev resources).
  // Only affects `next dev`; ignored by the static export/production build.
  allowedDevOrigins: ["127.0.0.1", "10.0.0.194"],
};

export default nextConfig;

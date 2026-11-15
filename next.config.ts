import type { NextConfig } from "next";

// Static export: the app is rendered at build time from the day's brief and served as plain files.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;

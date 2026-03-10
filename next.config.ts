import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin as a runtime external in SSR to avoid Turbopack
  // rewriting imports to virtual package names that are missing at runtime.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;

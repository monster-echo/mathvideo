const nextConfig = {
  experimental: {
    // Keep firebase-admin as a runtime external in SSR to avoid bundler
    // rewriting imports to virtual package names that are missing at runtime.
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Ignore les erreurs TypeScript pendant le build (temporaire)
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Ignore les erreurs ESLint pendant le build (temporaire)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

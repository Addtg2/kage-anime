import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Shikimori отдаёт постеры с .io; Kodik-плеер сам в iframe — Image не нужен.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shikimori.io",
        pathname: "/uploads/**",
      },
    ],
  },
  // React 19.2 + Next 16 — нативные View Transitions для синематичных
  // переходов между страницами (морф постера → hero).
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;

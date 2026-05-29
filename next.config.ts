import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешаем LAN-доступ в dev (Next 16 блокирует cross-origin к /_next/* по умолчанию)
  allowedDevOrigins: ["192.168.1.114", "172.16.0.1"],
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
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

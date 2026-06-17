import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 95],
    localPatterns: [
      {
        pathname: "/assets/bolero/**"
      },
      {
        pathname: "/assets/payment/**"
      }
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.ironrootnutrition.com",
        pathname: "/wp-content/uploads/**"
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com"
      }
    ]
  }
};

export default nextConfig;

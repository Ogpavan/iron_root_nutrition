import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/supplements/weight-mass-gainers",
        destination: "/supplements/gainer",
        permanent: true
      },
      {
        source: "/supplements/pre-workout-performance",
        destination: "/supplements/pre-workout",
        permanent: true
      }
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 95],
    localPatterns: [
      {
        pathname: "/assets/bolero/**"
      },
      {
        pathname: "/assets/payment/**"
      },
      {
        pathname: "/assets/trust-icons/**"
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

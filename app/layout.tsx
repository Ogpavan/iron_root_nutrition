import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import MiniCart from "@/components/cart/MiniCart";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ironrootnutrition.local";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bolero Advanced Hydration | Sugar-Free Drink Mix",
    template: "%s | Bolero Advanced Hydration"
  },
  description:
    "A polished Next.js storefront homepage for Bolero-style sugar-free hydration mixes, built with responsive components, local assets, and SEO metadata.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Bolero Advanced Hydration",
    description:
      "Sugar-free drink mixes, fresh flavours, hydration bottles, and lifestyle nutrition in a responsive storefront.",
    url: "/",
    siteName: "Bolero Advanced Hydration",
    images: [
      {
        url: "/assets/bolero/hero-bolero.webp",
        width: 1672,
        height: 941,
        alt: "IronRoot whey protein tubs on a chocolate orange background"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolero Advanced Hydration",
    description: "Sugar-free hydration mixes in a high-performance Next.js storefront.",
    images: ["/assets/bolero/hero-bolero.webp"]
  },
  icons: {
    icon: "/assets/bolero/favicon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ff8235"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <SiteFooter />
          <MiniCart />
        </CartProvider>
      </body>
    </html>
  );
}

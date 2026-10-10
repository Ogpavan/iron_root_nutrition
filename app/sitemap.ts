import type { MetadataRoute } from "next";
import { news, products as fallbackProducts } from "@/lib/home-data";
import { getAllProducts } from "@/lib/woocommerce";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ironrootnutrition.com";
const sitemapLastModified = "2026-10-10";

const categorySlugs = [
  "protein",
  "gainer",
  "pre-workout",
  "amino-acids",
  "creatine",
  "vitamins-wellness",
  "essential-fats"
];

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    lastModified: sitemapLastModified,
    priority
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/", 1),
    entry("/support", 0.9),
    entry("/supplements", 0.9),
    entry("/authenticity", 0.9),
    entry("/founder-inspiring-story", 0.9),
    entry("/blog", 0.9),
    entry("/privacy-policy", 0.9),
    entry("/terms-of-service", 0.9),
    ...categorySlugs.map((slug) => entry(`/supplements/${slug}`, 0.85))
  ];

  // Use the live catalog when available so deleted products do not remain indexed.
  // Keep the known catalog as a fallback if WooCommerce is unavailable.
  const products = await getAllProducts(100);
  const catalog = products.length > 0 ? products : fallbackProducts;
  const productEntries = catalog
    .filter((product) => product.slug)
    .map((product) => {
      const productPath = product.href || `/supplements/${product.categorySlugs?.[0] || "all"}/${product.slug}`;
      return entry(productPath, 0.8);
    });
  const blogEntries = news.map((item) => entry(`/blog/${item.slug}`, 0.8));

  return [...staticEntries, ...productEntries, ...blogEntries];
}

import type { MetadataRoute } from "next";
import { news } from "@/lib/home-data";
import { getAllProducts } from "@/lib/woocommerce";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ironrootnutrition.com";

const productSlugs = [
  "myofuel-whey-protein",
  "profusion-whey-protein",
  "alphagrid-pre-workout",
  "big-build-weight-gainer",
  "titan-meal-mass-gainer",
  "pre-shock-pre-workout",
  "glutabuild-l-glutamine",
  "intracharge-bcaa",
  "crealift-creatine",
  "truedose-multivitamin",
  "ironroot-liveraxis",
  "ironroot-fish-oil-triple-strength",
  "casein-protein"
];

const concernSlugs = [
  "build-lean-muscle",
  "strength-performance",
  "mass-weight-gain",
  "recovery-repair",
  "overall-health-wellness"
];

const categorySlugs = ["protein", "mass-gainer", "pre-workout", "creatine", "bcaa", "glutamine"];

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    priority
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/", 1),
    entry("/support", 0.9),
    entry("/all-products", 0.9),
    entry("/authenticity", 0.9),
    entry("/founder-inspiring-story", 0.9),
    entry("/blog", 0.9),
    entry("/privacy-policy", 0.9),
    entry("/terms-of-service", 0.9),
    ...concernSlugs.map((slug) => entry(`/all-products?concern=${slug}`, 0.9)),
    ...categorySlugs.map((slug) => entry(`/all-products?category=${slug}`, 0.9))
  ];

  // Use the live catalog when available so deleted products do not remain indexed.
  // Keep the known catalog as a fallback if WooCommerce is unavailable.
  const products = await getAllProducts(100);
  const availableProductSlugs = products.length > 0 ? products.map((product) => product.slug) : productSlugs;
  const productEntries = availableProductSlugs.map((slug) => entry(`/products/${slug}`, 0.8));
  const blogEntries = news.map((item) => entry(`/blog/${item.slug}`, 0.8));

  return [...staticEntries, ...productEntries, ...blogEntries];
}

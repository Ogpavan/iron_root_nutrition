import type { MetadataRoute } from "next";
import { news } from "@/lib/home-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ironrootnutrition.local";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/all-products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${siteUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    }
  ];

  const blogEntries = news.map(
    (item): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/blog/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    })
  );

  return [...staticEntries, ...blogEntries];
}
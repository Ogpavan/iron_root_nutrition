import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";
import type { HomeProduct } from "@/lib/home-data";

export const metadata: Metadata = {
  title: {
    absolute: "Gym Supplements for Strength & Performance | IronRoot Nutrition"
  },
  description:
    "Shop protein, creatine, pre workout, mass gainer, and wellness supplements from IronRoot Nutrition. Find nutrition for strength, performance, recovery, and everyday fitness.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Gym Supplements for Strength & Performance | IronRoot Nutrition",
    description:
      "Shop protein, creatine, pre workout, mass gainer, and wellness supplements from IronRoot Nutrition.",
    url: "/",
    siteName: "IronRoot Nutrition",
    images: [
      {
        url: "/assets/bolero/hero-bolero.webp",
        width: 1672,
        height: 941,
        alt: "IronRoot Nutrition sports supplements"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Gym Supplements for Strength & Performance | IronRoot Nutrition",
    description:
      "Shop protein, creatine, pre workout, mass gainer, and wellness supplements from IronRoot Nutrition.",
    images: ["/assets/bolero/hero-bolero.webp"]
  }
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ironrootnutrition.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "IronRoot Nutrition",
      url: siteUrl,
      logo: `${siteUrl}/assets/bolero/logo.svg`
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "IronRoot Nutrition",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` }
    }
  ]
};

function normalizeProductMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findProductByAliases(products: HomeProduct[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeProductMatch);

  return products.find((product) => {
    const value = normalizeProductMatch(
      `${product.name} ${product.tag} ${product.slug ?? ""} ${product.sku ?? ""}`
    );

    return normalizedAliases.some((alias) => value.includes(alias));
  });
}

function getFeaturedProducts(products: HomeProduct[]) {
  const featuredAliases = [
    ["myofuel whey protein", "myo fuel whey protein", "myofuel whey", "myo fuel whey"],
    ["pro fusion", "profusion"],
    ["alpha grid", "alphagrid"],
    ["big build weight gainer", "big build wieght gainer", "big build", "weight gainer"],
    ["titan meal", "mass gainer"]
  ];
  const selected = featuredAliases
    .map((aliases) => findProductByAliases(products, aliases))
    .filter((product): product is HomeProduct => Boolean(product));
  const selectedKeys = new Set(selected.map((product) => product.id ?? product.slug ?? product.name));
  const fillerProducts = products.filter(
    (product) => !selectedKeys.has(product.id ?? product.slug ?? product.name)
  );

  return [...selected, ...fillerProducts].slice(0, 5);
}

export default async function Page() {
  const [allProducts, categories] = await Promise.all([getAllProducts(), getWooCategories()]);
  const products = getFeaturedProducts(allProducts);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage products={products} catalogProducts={allProducts} categories={categories} />
    </>
  );
}

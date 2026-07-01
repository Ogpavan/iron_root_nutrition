import HomePage from "@/components/HomePage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";
import type { HomeProduct } from "@/lib/home-data";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "IronRoot Nutrition",
  url: "https://ironrootnutrition.local",
  logo: "https://ironrootnutrition.local/assets/bolero/logo.svg",
  sameAs: [
    "https://www.instagram.com/shopify/",
    "https://www.youtube.com/shopify",
    "https://www.facebook.com/ShopifyNL/"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer service",
    email: "support@example.com"
  }
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

import HomePage from "@/components/HomePage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bolero Advanced Hydration",
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

export default async function Page() {
  const [allProducts, categories] = await Promise.all([getAllProducts(), getWooCategories()]);
  const products = allProducts.slice(0, 5);

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

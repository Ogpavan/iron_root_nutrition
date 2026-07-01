import type { Metadata } from "next";
import LegalPage, { termsOfServiceSections } from "@/components/LegalPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the IronRoot Nutrition terms for store use, orders, payments, shipping, returns, and support.",
  alternates: {
    canonical: "/terms-of-service"
  }
};

export default async function Page() {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return (
    <LegalPage
      categories={categories}
      products={products}
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms govern use of the IronRoot Nutrition storefront, including accounts, products, orders, checkout, shipping, and support."
      updatedAt="June 26, 2026"
      sections={termsOfServiceSections}
    />
  );
}

import type { Metadata } from "next";
import SupportPage from "@/components/SupportPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Support",
  description: "Contact IronRoot Nutrition support for orders, products, delivery, and authenticity help.",
  alternates: {
    canonical: "/support"
  }
};

export default async function Page() {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return <SupportPage products={products} categories={categories} />;
}

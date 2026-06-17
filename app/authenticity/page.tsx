import type { Metadata } from "next";
import AuthenticityPage from "@/components/AuthenticityPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Authenticity",
  description: "Verify your IronRoot Nutrition product with the barcode printed on the pack.",
  alternates: {
    canonical: "/authenticity"
  }
};

export default async function Page() {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return <AuthenticityPage products={products} categories={categories} />;
}

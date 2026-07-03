import type { Metadata } from "next";
import FounderStoryPage from "@/components/FounderStoryPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Founder Inspiring Story",
  description:
    "Read the IronRoot founder story: built for training, shaped by discipline, and focused on consistent performance nutrition.",
  alternates: {
    canonical: "/founder-inspiring-story"
  }
};

export default async function Page() {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return <FounderStoryPage products={products} categories={categories} />;
}

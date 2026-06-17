import type { Metadata } from "next";
import ShopBrowsePage from "@/components/ShopBrowsePage";
import { concernItems } from "@/lib/home-data";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Shop by Concern",
  description: "Browse IronRoot products by fitness and wellness concern.",
  alternates: {
    canonical: "/shop-by-concern"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return (
    <ShopBrowsePage
      title="Shop by Concern"
      eyebrow="Browse goals"
      categories={categories}
      items={concernItems}
    />
  );
}

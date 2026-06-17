import type { Metadata } from "next";
import ShopBrowsePage from "@/components/ShopBrowsePage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Shop by Category",
  description: "Browse IronRoot products by category.",
  alternates: {
    canonical: "/shop-by-category"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return (
    <ShopBrowsePage
      title="Shop by Category"
      eyebrow="Browse products"
      categories={categories}
      items={categories.map((category) => ({
        title: category.name,
        href: category.href,
        image: category.image
      }))}
    />
  );
}

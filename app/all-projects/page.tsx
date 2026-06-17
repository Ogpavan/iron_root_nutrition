import type { Metadata } from "next";
import AllProductsPage from "@/components/AllProductsPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "All Projects",
  description: "Browse all IronRoot products loaded from WordPress.",
  alternates: {
    canonical: "/all-projects"
  }
};

type PageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);
  const params = await searchParams;
  const category = Array.isArray(params?.category) ? params?.category[0] : params?.category;

  return (
    <AllProductsPage
      products={products}
      categories={categories}
      title="All Projects"
      initialCategory={category || "all"}
    />
  );
}

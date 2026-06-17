import type { Metadata } from "next";
import AllProductsPage from "@/components/AllProductsPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse all IronRoot products loaded from WordPress.",
  alternates: {
    canonical: "/all-products"
  }
};

type PageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    concern?: string | string[];
    q?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);
  const params = await searchParams;
  const category = Array.isArray(params?.category) ? params?.category[0] : params?.category;
  const concern = Array.isArray(params?.concern) ? params?.concern[0] : params?.concern;
  const query = Array.isArray(params?.q) ? params?.q[0] : params?.q;

  return (
    <AllProductsPage
      products={products}
      categories={categories}
      title="All Products"
      initialCategory={category || "all"}
      initialConcern={concern || "all"}
      initialSearch={query || ""}
    />
  );
}

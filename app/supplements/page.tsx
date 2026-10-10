import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import AllProductsPage from "@/components/AllProductsPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

type PageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    concern?: string | string[];
    q?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(params?.category || params?.concern || params?.q);

  return {
    title: "Shop Supplements Online",
    description:
      "Browse IronRoot Nutrition supplements, including protein, gainers, pre workout, amino acids, creatine, vitamins, and essential fats.",
    alternates: {
      canonical: "/supplements"
    },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "Shop Supplements Online | IronRoot Nutrition",
      description:
        "Browse protein, gainers, pre workout, amino acids, creatine, vitamins, and essential fats from IronRoot Nutrition.",
      url: "/supplements",
      siteName: "IronRoot Nutrition",
      type: "website"
    }
  };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = firstValue(params?.category);

  if (category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) {
    const query = new URLSearchParams();
    const concern = firstValue(params?.concern);
    const search = firstValue(params?.q);
    if (concern) query.set("concern", concern);
    if (search) query.set("q", search);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    permanentRedirect(`/supplements/${category}${suffix}`);
  }

  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return (
    <AllProductsPage
      products={products}
      categories={categories}
      title="Shop Supplements"
      initialCategory="all"
      initialConcern={firstValue(params?.concern) || "all"}
      initialSearch={firstValue(params?.q) || ""}
    />
  );
}

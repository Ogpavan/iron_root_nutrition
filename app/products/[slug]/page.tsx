import { notFound, permanentRedirect } from "next/navigation";
import { getAllProducts } from "@/lib/woocommerce";

type LegacyProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { slug } = await params;
  const products = await getAllProducts(100);
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  const category = product.categorySlugs?.[0] || "all";
  permanentRedirect(`/supplements/${category}/${slug}`);
}

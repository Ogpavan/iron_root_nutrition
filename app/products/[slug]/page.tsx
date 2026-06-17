import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsPage from "@/components/ProductDetailsPage";
import { getAllProducts, getProductReviews, getWooCategories } from "@/lib/woocommerce";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getAllProducts();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: "Product"
    };
  }

  return {
    title: product.name,
    description: product.shortDescription || product.description || `Shop ${product.name}.`,
    alternates: {
      canonical: `/products/${slug}`
    }
  };
}

export default async function Page({ params }: ProductPageProps) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.slug !== product.slug && item.tag === product.tag)
    .slice(0, 4);
  const fallbackRelated = products.filter((item) => item.slug !== product.slug).slice(0, 4);
  const productId = typeof product.id === "number" ? product.id : Number(product.id);
  const reviews = await getProductReviews(Number.isFinite(productId) ? productId : undefined);

  return (
    <ProductDetailsPage
      product={product}
      relatedProducts={relatedProducts.length > 0 ? relatedProducts : fallbackRelated}
      categories={categories}
      reviews={reviews}
    />
  );
}

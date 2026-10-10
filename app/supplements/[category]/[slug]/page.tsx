import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetailsPage from "@/components/ProductDetailsPage";
import { getAllProducts, getProductReviews, getWooCategories } from "@/lib/woocommerce";
import { getYoastMetadataBySlug } from "@/lib/yoast-seo";

type ProductPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const [products, yoastMetadata] = await Promise.all([
    getAllProducts(100),
    getYoastMetadataBySlug("product", slug)
  ]);
  const product = products.find((item) => item.slug === slug);

  if (!product) return { title: "Product" };

  const canonical = product.href || `/supplements/${product.categorySlugs?.[0] || "all"}/${slug}`;
  const categoryName = product.categoryNames?.[0];
  const description = product.shortDescription || product.description || `Shop ${product.name}.`;
  const title = categoryName ? `${product.name} | ${categoryName}` : product.name;

  if (yoastMetadata) {
    return {
      ...yoastMetadata,
      title,
      description,
      alternates: { canonical }
    };
  }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | IronRoot Nutrition`,
      description,
      url: canonical,
      siteName: "IronRoot Nutrition",
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
      type: "website"
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category: requestedCategory, slug } = await params;
  const [products, categories] = await Promise.all([
    getAllProducts(100, { includeVariations: true }),
    getWooCategories()
  ]);
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  const category = product.categorySlugs?.[0] || "all";
  if (requestedCategory !== category) {
    permanentRedirect(product.href || `/supplements/${category}/${slug}`);
  }

  const relatedProducts = products
    .filter((item) => item.slug !== product.slug && item.categorySlugs?.[0] === category)
    .slice(0, 4);
  const fallbackRelated = products.filter((item) => item.slug !== product.slug).slice(0, 4);
  const productId = typeof product.id === "number" ? product.id : Number(product.id);
  const reviews = await getProductReviews(Number.isFinite(productId) ? productId : undefined);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ironrootnutrition.com";
  const categoryName = product.categoryNames?.[0] || product.tag;
  const productUrl = product.href || `/supplements/${category}/${slug}`;
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop Supplements", item: `${siteUrl}/supplements` },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${siteUrl}/supplements/${category}`
      },
      { "@type": "ListItem", position: 3, name: product.name, item: `${siteUrl}${productUrl}` }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData).replace(/</g, "\\u003c") }}
      />
      <ProductDetailsPage
        product={product}
        relatedProducts={relatedProducts.length > 0 ? relatedProducts : fallbackRelated}
        categories={categories}
        reviews={reviews}
      />
    </>
  );
}

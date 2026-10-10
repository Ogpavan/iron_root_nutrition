import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AllProductsPage from "@/components/AllProductsPage";
import GainerCategoryArticle from "@/components/GainerCategoryArticle";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const categorySeo: Record<string, { title: string; description: string; metaTitle?: string; intro?: string }> = {
  protein: {
    title: "Protein Supplements",
    description: "Shop whey and casein protein supplements from IronRoot Nutrition for your training and recovery routine."
  },
  gainer: {
    title: "Weight Gainer Supplements",
    metaTitle: "Mass Gainer for Weight Gain & Muscle Growth | Shop Online",
    description:
      "Shop Mass Gainer & Weight Gainer for weight gain and muscle growth. Compare calories, protein and carbs to choose a formula that suits your training needs.",
    intro:
      "Mass Gainers provide a combination of calories, protein and carbohydrates, making a Mass Gainer Powder a practical option when regular meals aren't enough to meet your nutritional needs. They can be a practical addition to a diet focused on weight gain and muscle building. At IronRoot, you can explore Mass Gainer and Weight Gainer options, compare their nutritional profiles and choose a formula that fits your diet and training needs."
  },
  "pre-workout": {
    title: "Pre Workout Supplements",
    description: "Shop pre workout supplements from IronRoot Nutrition for energy, focus, and training performance."
  },
  "amino-acids": {
    title: "Amino Acid Supplements",
    description: "Browse BCAA and glutamine supplements from IronRoot Nutrition for your workout and recovery routine."
  },
  creatine: {
    title: "Creatine Supplements",
    description: "Shop creatine supplements from IronRoot Nutrition to support strength and high intensity training."
  },
  "vitamins-wellness": {
    title: "Vitamins & Wellness Supplements",
    description: "Explore multivitamin and wellness supplements from IronRoot Nutrition for everyday nutrition support."
  },
  "essential-fats": {
    title: "Essential Fat Supplements",
    description: "Shop fish oil and essential fat supplements from IronRoot Nutrition for your daily wellness routine."
  }
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const categories = await getWooCategories();
  const category = categories.find((item) => item.slug === slug);
  const seo = categorySeo[slug];

  if (!seo) {
    return { title: "Category Not Found", robots: { index: false, follow: true } };
  }

  const hasExtraFilters = Boolean(query?.concern || query?.q);
  const title = seo.metaTitle ?? `${seo.title} | IronRoot Nutrition`;
  
  return {
    title: { absolute: title },
    description: seo.description,
    alternates: {
      canonical: `/supplements/${slug}`
    },
    robots: hasExtraFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description: seo.description,
      url: `/supplements/${slug}`,
      siteName: "IronRoot Nutrition",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seo.description
    }
  };
}

export default async function SupplementCategoryPage({ params, searchParams }: PageProps) {
  const [{ category: slug }, query, products, categories] = await Promise.all([
    params,
    searchParams,
    getAllProducts(100),
    getWooCategories()
  ]);
  const category = categories.find((item) => item.slug === slug);
  const seo = categorySeo[slug];

  if (!seo) notFound();

  const categoryProducts = products.filter((product) => product.categorySlugs?.includes(slug));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ironrootnutrition.com";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.description,
    url: `${siteUrl}/supplements/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Shop Supplements", item: `${siteUrl}/supplements` },
        { "@type": "ListItem", position: 3, name: category?.name || seo.title, item: `${siteUrl}/supplements/${slug}` }
      ]
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categoryProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `${siteUrl}${product.href ?? `/supplements/${product.categorySlugs?.[0] || "all"}/${product.slug}`}`,
        image: product.image
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <AllProductsPage
        products={products}
        categories={categories}
        title="Shop Supplements"
        initialCategory={slug}
        initialConcern={firstValue(query?.concern) || "all"}
        initialSearch={firstValue(query?.q) || ""}
        categoryIntro={seo.intro}
        categoryContent={slug === "gainer" ? <GainerCategoryArticle /> : undefined}
      />
    </>
  );
}

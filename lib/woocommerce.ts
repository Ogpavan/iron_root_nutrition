import { flavourTiles, products as fallbackProducts, type HomeProduct } from "@/lib/home-data";

type WooImage = {
  src?: string;
};

type WooCategory = {
  id?: number;
  name?: string;
  slug?: string;
  count?: number;
  image?: {
    src?: string;
  };
};

type WooProduct = {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  price?: string;
  price_html?: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  stock_status?: string;
  images?: WooImage[];
  categories?: WooCategory[];
  meta_data?: {
    key?: string;
    value?: unknown;
  }[];
};

type WooProductReview = {
  id?: number;
  product_id?: number;
  reviewer?: string;
  review?: string;
  rating?: number;
  verified?: boolean;
};

export type ProductReview = {
  id: number | string;
  name: string;
  location: string;
  quote: string;
  rating: number;
};

const productTones = ["#f34a45", "#f6b63b", "#6d3aa2", "#31a164", "#e84d92"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function cleanHtml(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8377;|&\#x20b9;|₹/gi, "₹")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(product: WooProduct) {
  if (product.price) {
    const amount = Number(product.price);

    if (Number.isFinite(amount)) {
      return currencyFormatter.format(amount);
    }

    return product.price;
  }

  return cleanHtml(product.price_html) || "View product";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMetaString(product: WooProduct, keys: string[]) {
  const normalizedKeys = keys.map((key) => key.toLowerCase());
  const meta = product.meta_data?.find((item) => {
    const key = item.key?.toLowerCase();
    return key ? normalizedKeys.includes(key) : false;
  });

  if (typeof meta?.value === "string") {
    return meta.value.trim();
  }

  if (typeof meta?.value === "number") {
    return String(meta.value);
  }

  return undefined;
}

function mapProduct(product: WooProduct, index: number): HomeProduct {
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const slug = product.slug || slugify(product.name || fallback.name);
  const galleryImages = product.images?.map((image) => image.src).filter(Boolean) as string[] | undefined;
  const productCategories = product.categories?.filter((category) => category.name || category.slug) ?? [];
  const categoryNames = productCategories
    .map((category) => category.name)
    .filter(Boolean) as string[];
  const categorySlugs = productCategories
    .map((category) => category.slug || (category.name ? slugify(category.name) : undefined))
    .filter(Boolean) as string[];
  const barcode = getMetaString(product, [
    "source_product_id",
    "product_id",
    "_product_id",
    "shopify_product_id",
    "_shopify_product_id",
    "barcode",
    "_barcode"
  ]);

  return {
    id: product.id,
    sku: product.sku,
    barcode,
    slug,
    name: product.name || fallback.name,
    tag: categoryNames[0] || "IronRoot",
    price: formatPrice(product),
    image: product.images?.[0]?.src || fallback.image,
    hoverImage: product.images && product.images.length > 1 ? product.images[product.images.length - 1]?.src : undefined,
    galleryImages,
    categoryNames,
    categorySlugs,
    descriptionHtml: product.description,
    description: cleanHtml(product.description),
    shortDescription: cleanHtml(product.short_description),
    stockStatus: product.stock_status,
    tone: productTones[index % productTones.length],
    href: `/products/${slug}`
  };
}

function mapFallbackProduct(product: HomeProduct, index: number): HomeProduct {
  const slug = product.slug || slugify(product.name);
  const categoryNames = product.categoryNames?.length ? product.categoryNames : [product.tag];
  const categorySlugs = product.categorySlugs?.length ? product.categorySlugs : categoryNames.map(slugify);

  return {
    ...product,
    slug,
    categoryNames,
    categorySlugs,
    galleryImages: product.galleryImages || [product.image, product.hoverImage].filter(Boolean) as string[],
    descriptionHtml: product.descriptionHtml,
    tone: product.tone || productTones[index % productTones.length],
    href: `/products/${slug}`
  };
}

async function getWooProducts(limit: number, fallback: HomeProduct[]): Promise<HomeProduct[]> {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return fallback.map(mapFallbackProduct);
  }

  const endpoint = new URL("/wp-json/wc/v3/products", siteUrl);
  endpoint.searchParams.set("status", "publish");
  endpoint.searchParams.set("per_page", String(Math.min(limit, 100)));
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback.map(mapFallbackProduct);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return fallback.map(mapFallbackProduct);
    }

    const products = data.map((product, index) => mapProduct(product as WooProduct, index));

    return products.length > 0 ? products : fallback.map(mapFallbackProduct);
  } catch {
    return fallback.map(mapFallbackProduct);
  }
}

export async function getHomeProducts(limit = 5): Promise<HomeProduct[]> {
  return getWooProducts(limit, fallbackProducts.slice(0, limit));
}

export async function getAllProducts(limit = 48): Promise<HomeProduct[]> {
  return getWooProducts(limit, fallbackProducts);
}

function mapProductReview(review: WooProductReview, index: number): ProductReview {
  return {
    id: review.id ?? `review-${index}`,
    name: review.reviewer || "IronRoot customer",
    location: review.verified ? "Verified buyer" : "Customer review",
    quote: cleanHtml(review.review),
    rating: Math.max(1, Math.min(5, Math.round(review.rating ?? 5)))
  };
}

export async function getProductReviews(productId?: number, limit = 6): Promise<ProductReview[]> {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!siteUrl || !consumerKey || !consumerSecret || !productId) {
    return [];
  }

  const endpoint = new URL("/wp-json/wc/v3/products/reviews", siteUrl);
  endpoint.searchParams.set("product", String(productId));
  endpoint.searchParams.set("status", "approved");
  endpoint.searchParams.set("per_page", String(Math.min(limit, 100)));
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
      },
      next: {
        revalidate: 300
      }
    });

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((review, index) => mapProductReview(review as WooProductReview, index))
      .filter((review) => review.quote.length > 0);
  } catch {
    return [];
  }
}

export type WooCatalogCategory = {
  id?: number;
  name: string;
  slug: string;
  count: number;
  image: string;
  href: string;
};

const categoryFallbackImages = [
  "/assets/bolero/nav-lemonade.png",
  "/assets/bolero/ice-tea.jpg",
  "/assets/bolero/lifestyle-yellow-bottle.jpg",
  "/assets/bolero/product-strawberry.png",
  "/assets/bolero/product-pineapple.png",
  "/assets/bolero/product-apple.png"
];

const bcaaCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-05_29_57-PM.png";
const creatineCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-05_34_21-PM.png";
const proteinCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-05_37_57-PM.png";
const massGainerCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-05_41_58-PM.png";
const multivitaminCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-05_46_16-PM.png";
const preWorkoutCategoryImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-15-2026-06_08_35-PM.png";

const categoryFallbacks: WooCatalogCategory[] = [
  { name: "Lemonade", slug: "lemonade", count: 0, image: categoryFallbackImages[0], href: "/all-products" },
  { name: "Ice Tea", slug: "ice-tea", count: 0, image: categoryFallbackImages[1], href: "/all-products" },
  { name: "Sport", slug: "sport", count: 0, image: categoryFallbackImages[4], href: "/all-products" },
  { name: "Sale", slug: "sale", count: 0, image: categoryFallbackImages[3], href: "/all-products" },
  { name: "Drink Bottles", slug: "drink-bottles", count: 0, image: categoryFallbackImages[2], href: "/all-products" },
  { name: "Sticks", slug: "sticks", count: 0, image: categoryFallbackImages[5], href: "/all-products" }
];

const homepageCategoryImages = new Map(
  flavourTiles.map((tile) => [tile.title.toLowerCase(), tile.image])
);

function mapHomepageCategoryImage(name: string, slug: string) {
  const normalized = `${name} ${slug}`.toLowerCase();

  if (normalized.includes("bcaa")) return bcaaCategoryImage;
  if (normalized.includes("creatine")) return creatineCategoryImage;
  if (normalized.includes("multivitamin") || normalized.includes("liver axis")) return multivitaminCategoryImage;
  if (normalized.includes("pre workout") || normalized.includes("pre-workout")) return preWorkoutCategoryImage;
  if (normalized.includes("protein") || normalized.includes("fish oil")) return proteinCategoryImage;
  if (normalized.includes("mass gainer") || normalized.includes("glutamine")) return massGainerCategoryImage;
  if (normalized.includes("straw")) return homepageCategoryImages.get("strawberry");
  if (normalized.includes("pine")) return homepageCategoryImages.get("pineapple");
  if (normalized.includes("dragon")) return homepageCategoryImages.get("dragon fruit");

  return undefined;
}

function mapCategoryImage(slug: string, index: number) {
  const normalized = slug.toLowerCase();

  if (normalized.includes("bcaa")) return bcaaCategoryImage;
  if (normalized.includes("creatine")) return creatineCategoryImage;
  if (normalized.includes("multivitamin") || normalized.includes("liver-axis")) return multivitaminCategoryImage;
  if (normalized.includes("pre-workout") || normalized.includes("preworkout")) return preWorkoutCategoryImage;
  if (normalized.includes("protein") || normalized.includes("fish-oil")) return proteinCategoryImage;
  if (normalized.includes("mass-gainer") || normalized.includes("glutamine")) return massGainerCategoryImage;
  if (normalized.includes("lemon")) return categoryFallbackImages[0];
  if (normalized.includes("tea")) return categoryFallbackImages[1];
  if (normalized.includes("sport")) return categoryFallbackImages[2];
  if (normalized.includes("sale")) return categoryFallbackImages[3];
  if (normalized.includes("bottle")) return categoryFallbackImages[2];
  if (normalized.includes("stick")) return categoryFallbackImages[5];
  if (normalized.includes("pine")) return categoryFallbackImages[4];
  if (normalized.includes("dragon")) return categoryFallbackImages[5];
  if (normalized.includes("straw")) return categoryFallbackImages[3];
  if (normalized.includes("cream") || normalized.includes("vanilla")) return categoryFallbackImages[5];
  if (normalized.includes("fruit")) return categoryFallbackImages[4];
  if (normalized.includes("water")) return categoryFallbackImages[2];

  return categoryFallbackImages[index % categoryFallbackImages.length];
}

function mapCategory(category: WooCategory, index: number): WooCatalogCategory {
  const slug = category.slug || `category-${index}`;
  const sourceName = category.name || `Category ${index + 1}`;
  const normalizedName = sourceName.toLowerCase();
  const name =
    normalizedName.includes("fish oil") || normalizedName.includes("fish-oil") || normalizedName.includes("whey protein")
      ? "Protein"
      : normalizedName.includes("liver axis") || normalizedName.includes("liver-axis") || normalizedName.includes("multivitamin")
        ? "Multivitamins"
        : normalizedName.includes("glutamine")
        ? "Mass Gainer"
        : sourceName;
  const image = mapHomepageCategoryImage(name, slug) || category.image?.src || mapCategoryImage(slug, index);

  return {
    id: category.id,
    name,
    slug,
    count: category.count ?? 0,
    image,
    href: `/all-products?category=${encodeURIComponent(slug)}`
  };
}

function categoryPriority(category: WooCatalogCategory) {
  const normalized = `${category.name} ${category.slug}`.toLowerCase();

  if (normalized.includes("bcaa")) return 0;
  if (normalized.includes("creatine")) return 1;
  if (category.slug === "protein" || category.slug === "whey-protein") return 2;
  if (normalized.includes("protein") || normalized.includes("fish-oil")) return 2.5;
  if (normalized.includes("pre workout") || normalized.includes("pre-workout")) return 3;
  if (category.slug === "mass-gainer") return 4;
  if (normalized.includes("mass gainer") || normalized.includes("mass-gainer")) return 4.5;
  if (normalized.includes("multivitamin") || normalized.includes("liver-axis")) return 5;
  if (category.slug === "weight-gainer") return 6;

  return 100;
}

function selectCategories(categories: WooCatalogCategory[], limit: number) {
  const byDisplayName = new Map<string, WooCatalogCategory>();

  [...categories]
    .sort((first, second) => categoryPriority(first) - categoryPriority(second))
    .forEach((category) => {
      const key = category.name.toLowerCase();

      if (!byDisplayName.has(key)) {
        byDisplayName.set(key, category);
      }
    });

  return Array.from(byDisplayName.values()).slice(0, limit);
}

export async function getWooCategories(limit = 6): Promise<WooCatalogCategory[]> {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return categoryFallbacks.slice(0, limit);
  }

  const endpoint = new URL("/wp-json/wc/v3/products/categories", siteUrl);
  endpoint.searchParams.set("parent", "0");
  endpoint.searchParams.set("per_page", "100");
  endpoint.searchParams.set("orderby", "name");
  endpoint.searchParams.set("order", "asc");

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
      },
      next: {
        revalidate: 300
      }
    });

    if (!response.ok) {
      return categoryFallbacks.slice(0, limit);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return categoryFallbacks.slice(0, limit);
    }

    const categories = data.map((category, index) => mapCategory(category as WooCategory, index));
    return categories.length > 0 ? selectCategories(categories, limit) : categoryFallbacks.slice(0, limit);
  } catch {
    return categoryFallbacks.slice(0, limit);
  }
}

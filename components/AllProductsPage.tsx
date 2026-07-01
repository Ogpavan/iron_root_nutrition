"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion
} from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  X
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import type { HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type AllProductsPageProps = {
  products: HomeProduct[];
  categories: WooCatalogCategory[];
  title?: string;
  initialCategory?: string;
  initialConcern?: string;
  initialSearch?: string;
};

const concernFilters = [
  {
    label: "Build Lean Muscle",
    slug: "build-lean-muscle",
    tokens: ["pre workout", "workout", "protein", "lean", "muscle", "whey"]
  },
  {
    label: "Strength & Performance",
    slug: "strength-performance",
    tokens: ["pre workout", "creatine", "performance", "strength", "sport"]
  },
  {
    label: "Mass & Weight Gain",
    slug: "mass-weight-gain",
    tokens: ["mass gainer", "weight gain", "mass", "calorie", "bulk"]
  },
  {
    label: "Recovery & Repair",
    slug: "recovery-repair",
    tokens: ["fish oil", "recovery", "repair", "liver", "support"]
  },
  {
    label: "Overall Health & Wellness",
    slug: "overall-health-wellness",
    tokens: ["multivitamin", "health", "wellness", "organ support", "vitamin"]
  }
];

const priceFilters = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000+", min: 1000, max: Number.POSITIVE_INFINITY }
];

const sortOptions = ["Featured", "Newest First", "Price: Low to High", "Price: High to Low"];

const pageReveal = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

const gridReveal = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045
    }
  }
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: 12, filter: "blur(5px)" }
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function slugifyFilter(value: string) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductCategoryKeys(product: HomeProduct) {
  const keys = new Set<string>();

  [
    product.tag,
    ...(product.categoryNames ?? []),
    ...(product.categorySlugs ?? [])
  ]
    .map(slugifyFilter)
    .filter(Boolean)
    .forEach((key) => {
      keys.add(key);

      if (key.includes("protein") || key.includes("fish-oil")) keys.add("protein");
      if (key.includes("pre-workout") || key.includes("preworkout")) keys.add("pre-workout");
      if (key.includes("mass-gainer") || key.includes("weight-gainer") || key.includes("glutamine")) {
        keys.add("mass-gainer");
      }
      if (key.includes("multivitamin") || key.includes("liver-axis")) keys.add("multivitamin");
      if (key.includes("creatine")) keys.add("creatine");
      if (key.includes("bcaa")) keys.add("bcaa");
    });

  return keys;
}

function readPrice(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getDiscountPercent(product: HomeProduct) {
  const price = readPrice(product.price) ?? 0;
  const mrp = readPrice(product.mrp) ?? 0;

  if (price <= 0 || mrp <= price) {
    return 0;
  }

  return Math.round(((mrp - price) / mrp) * 100);
}

export default function AllProductsPage({
  products,
  categories,
  title = "All Products",
  initialCategory = "all",
  initialConcern = "all",
  initialSearch = ""
}: AllProductsPageProps) {
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const [activeConcern, setActiveConcern] = useState(initialConcern || "all");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activePrice, setActivePrice] = useState("all");
  const [sortBy, setSortBy] = useState("Featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(() => new Set());
  const [openFilters, setOpenFilters] = useState({
    categories: true,
    concerns: false,
    prices: false
  });

  const toggleFilter = (filter: keyof typeof openFilters) => {
    setOpenFilters((current) => ({
      ...current,
      [filter]: !current[filter]
    }));
  };

  const markImageLoaded = (src?: string) => {
    if (!src) {
      return;
    }

    setLoadedImages((current) => {
      if (current.has(src)) {
        return current;
      }

      const next = new Set(current);
      next.add(src);
      return next;
    });
  };

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const categoryOptions = useMemo(() => {
    const taggedProducts = products.flatMap((product) => {
      const names = product.categoryNames?.length ? product.categoryNames : [product.tag];
      const slugs = product.categorySlugs?.length ? product.categorySlugs : names.map(slugifyFilter);

      return names.map((name, index) => ({
        name,
        slug: slugifyFilter(slugs[index] || name),
        count: 0
      }));
    });
    const merged = [...categories, ...taggedProducts];
    const unique = new Map<string, { name: string; slug: string; count: number }>();

    merged.forEach((category) => {
      const key = slugifyFilter(category.slug || category.name);
      const count = products.filter((product) => getProductCategoryKeys(product).has(key)).length;

      if (count === 0) {
        return;
      }

      if (!unique.has(key)) {
        unique.set(key, {
          name: category.name,
          slug: key,
          count
        });
      }
    });

    return Array.from(unique.values()).slice(0, 10);
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    const searchTerms = normalize(searchQuery).split(" ").filter(Boolean);

    return products.filter((product) => {
      const haystack = normalize(
        [
          product.name,
          product.tag,
          product.price,
          product.sku,
          product.slug,
          product.shortDescription,
          product.description
        ]
          .filter(Boolean)
          .join(" ")
      );
      const productCategoryKeys = getProductCategoryKeys(product);
      const matchesCategory =
        activeCategory === "all" ||
        productCategoryKeys.has(slugifyFilter(activeCategory));
      const matchesSearch =
        searchTerms.length === 0 || searchTerms.every((term) => haystack.includes(term));
      const selectedConcern = concernFilters.find((concern) => concern.slug === activeConcern);
      const matchesConcern =
        activeConcern === "all" ||
        Boolean(selectedConcern?.tokens.some((token) => haystack.includes(token)));
      const productPrice = readPrice(product.price);
      const selectedPrice = priceFilters.find((price) => price.label === activePrice);
      const matchesPrice =
        activePrice === "all" ||
        (productPrice !== null &&
          Boolean(selectedPrice && productPrice >= selectedPrice.min && productPrice < selectedPrice.max));

      return matchesCategory && matchesSearch && matchesConcern && matchesPrice;
    });
  }, [activeCategory, activeConcern, activePrice, products, searchQuery]);

  const sortedProducts = useMemo(() => {
    const productsToSort = [...filteredProducts];

    if (sortBy === "Newest First") {
      return productsToSort.reverse();
    }

    if (sortBy === "Price: Low to High") {
      return productsToSort.sort((first, second) => {
        return (readPrice(first.price) ?? Number.MAX_SAFE_INTEGER) - (readPrice(second.price) ?? Number.MAX_SAFE_INTEGER);
      });
    }

    if (sortBy === "Price: High to Low") {
      return productsToSort.sort((first, second) => {
        return (readPrice(second.price) ?? 0) - (readPrice(first.price) ?? 0);
      });
    }

    return productsToSort;
  }, [filteredProducts, sortBy]);

  const hasActiveFilters =
    activeCategory !== "all" || activeConcern !== "all" || activePrice !== "all" || searchQuery.trim().length > 0;
  const resetFilters = () => {
    setActiveCategory("all");
    setActiveConcern("all");
    setActivePrice("all");
    setSearchQuery("");
  };
  const selectedCategoryName = categoryOptions.find((category) => category.slug === activeCategory)?.name;
  const collectionHeading = selectedCategoryName || (searchQuery.trim() ? "Search Results" : title);

  const filterSidebar = (
    <aside className="collection-filters" aria-label="Product filters">
      {hasActiveFilters ? (
        <button type="button" className="filter-reset" onClick={resetFilters}>
          <X aria-hidden="true" size={14} />
          Clear
        </button>
      ) : null}

      <div className="filter-group">
        <button
          type="button"
          className="filter-accordion-trigger"
          onClick={() => toggleFilter("categories")}
          aria-expanded={openFilters.categories}
        >
          <span>Availability</span>
          <ChevronDown aria-hidden="true" size={15} />
        </button>
          <div
            className="filter-accordion-panel"
            aria-hidden={!openFilters.categories}
            data-open={openFilters.categories}
          >
            <label className="filter-check">
              <input
                type="checkbox"
                checked={activeCategory === "all"}
                onChange={() => setActiveCategory("all")}
              />
              <span>In stock</span>
            </label>
            {categoryOptions.map((category) => (
              <label key={category.slug} className="filter-check">
                <input
                  type="checkbox"
                  checked={activeCategory === category.slug}
                  onChange={() => setActiveCategory(category.slug)}
                />
                <span>{category.name}</span>
                {category.count > 0 ? <small>{category.count}</small> : null}
              </label>
            ))}
          </div>
      </div>

      <div className="filter-group">
        <button
          type="button"
          className="filter-accordion-trigger"
          onClick={() => toggleFilter("concerns")}
          aria-expanded={openFilters.concerns}
        >
          <span>Concerns</span>
          <ChevronDown aria-hidden="true" size={15} />
        </button>
          <div
            className="filter-accordion-panel"
            aria-hidden={!openFilters.concerns}
            data-open={openFilters.concerns}
          >
            <label className="filter-check">
              <input
                type="checkbox"
                checked={activeConcern === "all"}
                onChange={() => setActiveConcern("all")}
              />
              <span>Any concern</span>
            </label>
            {concernFilters.map((concern) => (
              <label key={concern.label} className="filter-check">
                <input
                  type="checkbox"
                  checked={activeConcern === concern.slug}
                  onChange={() => setActiveConcern(concern.slug)}
                />
                <span>{concern.label}</span>
              </label>
            ))}
          </div>
      </div>

      <div className="filter-group">
        <button
          type="button"
          className="filter-accordion-trigger"
          onClick={() => toggleFilter("prices")}
          aria-expanded={openFilters.prices}
        >
          <span>Price</span>
          <ChevronDown aria-hidden="true" size={15} />
        </button>
          <div
            className="filter-accordion-panel"
            aria-hidden={!openFilters.prices}
            data-open={openFilters.prices}
          >
            <label className="filter-check">
              <input
                type="checkbox"
                checked={activePrice === "all"}
                onChange={() => setActivePrice("all")}
              />
              <span>Any price</span>
            </label>
            {priceFilters.map((price) => (
              <label key={price.label} className="filter-check">
                <input
                  type="checkbox"
                  checked={activePrice === price.label}
                  onChange={() => setActivePrice(price.label)}
                />
                <span>{price.label}</span>
              </label>
            ))}
          </div>
      </div>
    </aside>
  );

  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <motion.main
        className="collection-page"
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={pageReveal}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <nav className="collection-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Homepage</a>
          <ChevronRight aria-hidden="true" size={15} strokeWidth={2.8} />
          <span>{title}</span>
        </nav>

        <div className="collection-layout">
          <div className="collection-sidebar">{filterSidebar}</div>

          <section className="collection-results" aria-live="polite">
            <div className="collection-toolbar">
              <div className="collection-title-block">
                <h1>{collectionHeading}</h1>
                {searchQuery.trim() ? (
                  <div className="collection-search-chip">
                    <span>{searchQuery.trim()}</span>
                    <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")}>
                      <X aria-hidden="true" size={13} />
                    </button>
                  </div>
                ) : null}
                <div className="collection-count">
                  {sortedProducts.length} products
                </div>
              </div>
              <button
                type="button"
                className="mobile-filter-button"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal aria-hidden="true" size={16} />
                Filters
              </button>
              <div className="collection-view-sort">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <motion.div
              className="collection-grid"
              aria-label={title}
              variants={gridReveal}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              layout
            >
              <AnimatePresence mode="popLayout">
                {sortedProducts.map((product, index) => (
                  <motion.article
                    className="collection-card"
                    key={product.id ?? product.slug ?? `${product.name}-${index}`}
                    variants={cardReveal}
                    initial={reduceMotion ? false : "hidden"}
                    animate="show"
                    exit="exit"
                    layout
                    transition={{
                      duration: 0.34,
                      delay: reduceMotion ? 0 : Math.min(index, 9) * 0.025,
                      ease: "easeOut"
                    }}
                  >
                    <div className="collection-card-media">
                      <a href={product.href ?? "#"} aria-label={product.name}>
                        <span className="collection-product-glow" style={{ backgroundColor: product.tone }} />
                        <span className="collection-image-flip">
                          <span className="collection-image-face collection-image-front">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className={loadedImages.has(product.image) ? "is-loaded" : undefined}
                              loading={index < 6 ? "eager" : "lazy"}
                              onLoad={() => markImageLoaded(product.image)}
                              sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
                            />
                          </span>
                          {product.hoverImage ? (
                            <span className="collection-image-face collection-image-back">
                              <Image
                                src={product.hoverImage}
                                alt=""
                                fill
                                className={loadedImages.has(product.hoverImage) ? "is-loaded" : undefined}
                                loading="lazy"
                                onLoad={() => markImageLoaded(product.hoverImage)}
                                sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </span>
                      </a>
                      <button
                        type="button"
                        className="quick-add-button"
                        aria-label={`Add ${product.name} to cart`}
                        onClick={() => addItem(product)}
                      >
                        <Plus aria-hidden="true" size={28} strokeWidth={1.8} />
                      </button>
                    </div>
                    <div className="collection-card-body">
                      <span className="collection-card-tag">{product.tag}</span>
                      <a className="collection-card-title" href={product.href ?? "#"}>
                        {product.name}
                      </a>
                      <div className="collection-price-row">
                        <strong className="collection-card-price">{product.price}</strong>
                        {product.mrp && getDiscountPercent(product) > 0 ? (
                          <>
                            <span className="collection-card-mrp">{product.mrp}</span>
                            <span className="product-discount-badge collection-discount-badge">
                              {getDiscountPercent(product)}% off
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
            {sortedProducts.length === 0 ? (
              <div className="collection-empty">
                <p>No products match these filters.</p>
                <button type="button" className="filter-reset" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            ) : null}
          </section>
        </div>
        {mobileFiltersOpen ? (
          <div className="mobile-filter-drawer" role="dialog" aria-modal="true" aria-label="Product filters">
            <button
              type="button"
              className="mobile-filter-backdrop"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="mobile-filter-panel">
              <button type="button" className="mobile-filter-close" onClick={() => setMobileFiltersOpen(false)}>
                <X aria-hidden="true" size={18} />
                Close
              </button>
              {filterSidebar}
            </div>
          </div>
        ) : null}
      </motion.main>
    </>
  );
}

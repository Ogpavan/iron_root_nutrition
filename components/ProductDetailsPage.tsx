"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Mail, Minus, Plus, ShoppingCart, Star, X, Zap } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import type { HomeProduct, ProductVariation, ProductVariationAttribute } from "@/lib/home-data";
import type { ProductReview, WooCatalogCategory } from "@/lib/woocommerce";

type ProductDetailsPageProps = {
  product: HomeProduct;
  relatedProducts: HomeProduct[];
  categories: WooCatalogCategory[];
  reviews: ProductReview[];
};

const detailSections = [
  {
    key: "description",
    title: "Description"
  },
  {
    key: "ingredients",
    title: "Ingredients"
  },
  {
    key: "shipping",
    title: "Shipping and returns"
  }
];

const detailPageReveal = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

const detailStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08
    }
  }
};

const detailCopyItem = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" }
};

const detailHeadingItem = {
  hidden: { opacity: 0, x: -36, filter: "blur(8px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)" }
};

const galleryReveal = {
  hidden: { opacity: 0, x: -28, filter: "blur(8px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)" }
};

const customerReviews = [
  {
    name: "Aarav Sharma",
    location: "Mumbai",
    quote:
      "IronRoot fits perfectly into my training routine. The mixability is smooth, the taste is solid, and it keeps my daily protein goals simple."
  },
  {
    name: "Priya Nair",
    location: "Bengaluru",
    quote:
      "I wanted supplements that feel dependable and easy to use every day. IronRoot has become my go-to after workouts and busy workdays."
  },
  {
    name: "Rohan Mehta",
    location: "Delhi",
    quote:
      "The flavour is clean, not overpowering, and the results feel consistent. It is exactly what I need for regular gym sessions."
  }
];

const fallbackReviews: ProductReview[] = customerReviews.map((review, index) => ({
  id: `fallback-${index}`,
  name: review.name,
  location: review.location,
  quote: review.quote,
  rating: 5
}));

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");

  return initials.toUpperCase() || "IR";
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.14 6.43 2.14 11.89c0 1.74.46 3.44 1.33 4.94L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.43 9.9-9.89C21.95 6.45 17.5 2 12.04 2Zm.01 18.12h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.14.82.84-3.06-.2-.31a8.15 8.15 0 0 1-1.25-4.36c0-4.53 3.69-8.2 8.23-8.2 2.2 0 4.26.86 5.81 2.41a8.15 8.15 0 0 1 2.41 5.82c0 4.52-3.69 8.2-8.21 8.2Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z"
      />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.1 2C6.57 2 3.7 5.96 3.7 9.26c0 2 .75 3.78 2.36 4.44.26.11.5 0 .58-.29.05-.2.18-.72.24-.94.08-.29.05-.39-.17-.65-.46-.54-.75-1.24-.75-2.23 0-2.94 2.2-5.57 5.73-5.57 3.13 0 4.85 1.91 4.85 4.46 0 3.36-1.49 6.19-3.7 6.19-1.22 0-2.14-1.01-1.84-2.25.35-1.48 1.03-3.07 1.03-4.14 0-.96-.51-1.75-1.57-1.75-1.25 0-2.25 1.29-2.25 3.02 0 1.1.37 1.85.37 1.85s-1.28 5.44-1.5 6.39c-.45 1.9-.07 4.23-.04 4.46.02.14.2.17.28.07.12-.15 1.62-2 2.13-3.85.14-.52.83-3.24.83-3.24.41.78 1.61 1.47 2.88 1.47 3.79 0 6.36-3.45 6.36-8.08C19.53 5.4 16.57 2 12.1 2Z"
      />
    </svg>
  );
}


type SelectedVariationOptions = Record<string, string>;

function normalizeVariationKey(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^pa[_-]/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function optionMatches(first?: string, second?: string) {
  return normalizeVariationKey(first) === normalizeVariationKey(second);
}

function getVariationOption(variation: ProductVariation, attributeName: string) {
  return variation.attributes.find((attribute) => optionMatches(attribute.name, attributeName))?.option ?? "";
}

function getSelectableAttributes(product: HomeProduct): NonNullable<HomeProduct["attributes"]> {
  const directAttributes =
    product.attributes?.filter((attribute) => attribute.variation !== false && attribute.options.length > 0) ?? [];

  if (directAttributes.length > 0) {
    return directAttributes;
  }

  const attributesByKey = new Map<string, { name: string; options: Set<string> }>();

  product.variations?.forEach((variation) => {
    variation.attributes.forEach((attribute) => {
      const key = normalizeVariationKey(attribute.name);

      if (!key || !attribute.option) {
        return;
      }

      const current = attributesByKey.get(key) ?? { name: attribute.name, options: new Set<string>() };
      current.options.add(attribute.option);
      attributesByKey.set(key, current);
    });
  });

  return Array.from(attributesByKey.values()).map((attribute) => ({
    name: attribute.name,
    options: Array.from(attribute.options),
    visible: true,
    variation: true
  }));
}

function findMatchingOption(options: string[], value?: string) {
  return options.find((option) => optionMatches(option, value));
}

function getInitialSelectedOptions(product: HomeProduct): SelectedVariationOptions {
  const selected: SelectedVariationOptions = {};
  const defaults = new Map(
    product.defaultAttributes?.map((attribute) => [normalizeVariationKey(attribute.name), attribute.option]) ?? []
  );

  getSelectableAttributes(product).forEach((attribute) => {
    const key = normalizeVariationKey(attribute.name);
    const defaultOption = findMatchingOption(attribute.options, defaults.get(key));
    const firstVariationOption = attribute.options.find((option) =>
      product.variations?.some((variation) => optionMatches(getVariationOption(variation, attribute.name), option))
    );

    selected[key] = defaultOption ?? firstVariationOption ?? attribute.options[0] ?? "";
  });

  return selected;
}

function variationMatchesSelection(
  variation: ProductVariation,
  attributes: NonNullable<HomeProduct["attributes"]>,
  selectedOptions: SelectedVariationOptions
) {
  return attributes.every((attribute) => {
    const selected = selectedOptions[normalizeVariationKey(attribute.name)];
    return selected && optionMatches(getVariationOption(variation, attribute.name), selected);
  });
}

function variationOptionExists(
  variations: ProductVariation[] | undefined,
  attributes: NonNullable<HomeProduct["attributes"]>,
  selectedOptions: SelectedVariationOptions,
  attributeName: string,
  option: string
) {
  if (!variations?.length) {
    return true;
  }

  return variations.some((variation) => {
    if (!optionMatches(getVariationOption(variation, attributeName), option)) {
      return false;
    }

    return attributes.every((attribute) => {
      if (optionMatches(attribute.name, attributeName)) {
        return true;
      }

      const selected = selectedOptions[normalizeVariationKey(attribute.name)];
      return !selected || optionMatches(getVariationOption(variation, attribute.name), selected);
    });
  });
}

function getSelectedVariationAttributes(
  attributes: NonNullable<HomeProduct["attributes"]>,
  selectedOptions: SelectedVariationOptions
): ProductVariationAttribute[] {
  return attributes.reduce<ProductVariationAttribute[]>((selectedAttributes, attribute) => {
    const option = selectedOptions[normalizeVariationKey(attribute.name)];

    if (!option) {
      return selectedAttributes;
    }

    selectedAttributes.push({
      name: attribute.name,
      slug: attribute.slug,
      option
    });

    return selectedAttributes;
  }, []);
}

function readPrice(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDiscountPercent(priceValue?: string, mrpValue?: string) {
  const price = readPrice(priceValue);
  const mrp = readPrice(mrpValue);

  if (price <= 0 || mrp <= price) {
    return 0;
  }

  return Math.round(((mrp - price) / mrp) * 100);
}
function buildCartProduct(
  product: HomeProduct,
  activeVariation: ProductVariation | undefined,
  attributes: NonNullable<HomeProduct["attributes"]>,
  selectedOptions: SelectedVariationOptions
) {
  const selectedAttributes = activeVariation?.attributes.length
    ? activeVariation.attributes
    : getSelectedVariationAttributes(attributes, selectedOptions);
  const suffix = selectedAttributes.map((attribute) => attribute.option).filter(Boolean).join(" / ");

  return {
    id: product.id,
    variationId: activeVariation?.id,
    variationAttributes: selectedAttributes,
    name: suffix ? `${product.name} - ${suffix}` : product.name,
    price: activeVariation?.price ?? product.price,
    image: activeVariation?.image ?? product.image,
    tag: product.tag,
    href: product.href
  };
}
export default function ProductDetailsPage({
  product,
  relatedProducts,
  categories,
  reviews
}: ProductDetailsPageProps) {
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedOptions, setSelectedOptions] = useState<SelectedVariationOptions>(() =>
    getInitialSelectedOptions(product)
  );
  const selectableAttributes = useMemo(() => getSelectableAttributes(product), [product]);
  const hasSelectableAttributes = selectableAttributes.length > 0;
  const gallery = useMemo(() => {
    const variationImages = product.variations?.map((variation) => variation.image).filter(Boolean) as string[] | undefined;
    const images = [product.image, ...(product.galleryImages ?? []), ...(variationImages ?? [])];
    return Array.from(new Set(images.filter(Boolean)));
  }, [product.galleryImages, product.image, product.variations]);
  const activeVariation = useMemo(() => {
    if (!hasSelectableAttributes) {
      return undefined;
    }

    return product.variations?.find((variation) =>
      variationMatchesSelection(variation, selectableAttributes, selectedOptions)
    );
  }, [hasSelectableAttributes, product.variations, selectableAttributes, selectedOptions]);
  const displayPrice = activeVariation?.price ?? product.price;
  const displayMrp = activeVariation?.mrp ?? product.mrp;
  const discountPercent = getDiscountPercent(displayPrice, displayMrp);
  const displayStockStatus = activeVariation?.stockStatus ?? product.stockStatus;
  const selectedCartProduct = useMemo(
    () => buildCartProduct(product, activeVariation, selectableAttributes, selectedOptions),
    [activeVariation, product, selectableAttributes, selectedOptions]
  );
  const addDisabled = hasSelectableAttributes && (!activeVariation || displayStockStatus === "outofstock");

  useEffect(() => {
    setSelectedOptions(getInitialSelectedOptions(product));
    setActiveImage(product.image);
  }, [product]);

  useEffect(() => {
    if (activeVariation?.image) {
      setActiveImage(activeVariation.image);
    }
  }, [activeVariation?.image]);

  const addSelectedItem = () => {
    if (addDisabled) {
      return;
    }

    addItem(selectedCartProduct, quantity);
  };

  const description =
    product.description ||
    product.shortDescription ||
    "A refreshing IronRoot product made for simple daily hydration and flavour.";
  const displayReviews = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <motion.main
        className="product-detail-page"
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={detailPageReveal}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.nav
          className="product-detail-breadcrumb"
          aria-label="Breadcrumb"
          variants={detailCopyItem}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <a href="/">Homepage</a>
          <ChevronRight aria-hidden="true" size={15} strokeWidth={2.8} />
          <a href="/all-products">All Products</a>
          <ChevronRight aria-hidden="true" size={15} strokeWidth={2.8} />
          <span>{product.name}</span>
        </motion.nav>

        <section className="product-detail-layout">
          <motion.div
            className="product-detail-gallery"
            variants={galleryReveal}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <motion.div
              className="product-detail-thumbs"
              aria-label="Product images"
              variants={detailStagger}
            >
              {gallery.slice(0, 6).map((image, index) => (
                <motion.button
                  type="button"
                  key={`${image}-${index}`}
                  className={activeImage === image ? "is-active" : undefined}
                  onClick={() => setActiveImage(image)}
                  aria-label={`Show product image ${index + 1}`}
                  variants={detailCopyItem}
                  transition={{ duration: 0.38, ease: "easeOut" }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                >
                  <Image
                    src={image}
                    width={86}
                    height={100}
                    alt=""
                    aria-hidden="true"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              className="product-detail-media"
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              transition={{ duration: 0.25 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  className="product-detail-media-frame"
                  key={activeImage}
                  initial={reduceMotion ? false : { opacity: 0, scale: 1.025, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                >
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 900px) 100vw, 56vw"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <motion.aside
            className="product-detail-info"
            variants={detailStagger}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <motion.p
              className="product-detail-tag"
              variants={detailCopyItem}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {product.tag}
            </motion.p>
            <motion.h1
              variants={detailHeadingItem}
              transition={{ duration: 0.68, ease: "easeOut" }}
            >
              {product.name}
            </motion.h1>
            <motion.div
              className="product-detail-price-row"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              <strong className="product-detail-price">{displayPrice}</strong>
              {displayMrp && discountPercent > 0 ? (
                <>
                  <span className="product-detail-mrp">{displayMrp}</span>
                  <span className="product-discount-badge product-detail-discount-badge">{discountPercent}% off</span>
                </>
              ) : null}
            </motion.div>
            <motion.p
              className="product-detail-stock"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              {displayStockStatus === "outofstock" ? "Out of stock" : "In stock"}
            </motion.p>

            {hasSelectableAttributes ? (
              <motion.div
                className="product-variation-options"
                variants={detailCopyItem}
                transition={{ duration: 0.52, ease: "easeOut" }}
              >
                {selectableAttributes.map((attribute) => {
                  const attributeKey = normalizeVariationKey(attribute.name);

                  return (
                    <div className="product-variation-group" key={attributeKey}>
                      <strong>{attribute.name}</strong>
                      <div className="product-variation-values">
                        {attribute.options.map((option) => {
                          const isSelected = optionMatches(selectedOptions[attributeKey], option);
                          const isAvailable = variationOptionExists(
                            product.variations,
                            selectableAttributes,
                            selectedOptions,
                            attribute.name,
                            option
                          );

                          return (
                            <button
                              type="button"
                              key={option}
                              className={isSelected ? "is-selected" : undefined}
                              disabled={!isAvailable}
                              onClick={() =>
                                setSelectedOptions((current) => ({
                                  ...current,
                                  [attributeKey]: option
                                }))
                              }
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {!activeVariation ? <p>Choose an available variation.</p> : null}
              </motion.div>
            ) : null}

            <motion.div
              className="product-detail-actions"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              <div className="quantity-stepper" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => value + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
              <button type="button" className="product-add-button" onClick={addSelectedItem} disabled={addDisabled}>
                <ShoppingCart size={17} aria-hidden="true" />
                <span>Add to cart</span>
              </button>
            </motion.div>

            <motion.button
              type="button"
              className="product-buy-button"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
              onClick={addSelectedItem}
              disabled={addDisabled}
            >
              <Zap size={17} aria-hidden="true" />
              <span>Buy it now</span>
            </motion.button>

            <motion.ul
              className="product-detail-promises"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              <li>Free delivery on orders over ₹3,500</li>
              <li>14-Day return policy</li>
            </motion.ul>

            <motion.div
              className="product-review-share"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              <a className="product-review-row" href="#reviews">
                <strong>Reviews</strong>
                <span aria-label="0 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill="currentColor" aria-hidden="true" />
                  ))}
                </span>
                <em>0 reviews</em>
                <ChevronRight aria-hidden="true" size={18} />
              </a>

              <div className="product-share-row">
                <strong>Share</strong>
                <div className="product-share-icons" aria-label="Share product">
                  <a href={`https://wa.me/?text=${encodeURIComponent(product.name)}`} aria-label="Share on WhatsApp">
                    <WhatsAppIcon />
                  </a>
                  <a href="https://www.facebook.com/sharer/sharer.php" aria-label="Share on Facebook">
                    <FacebookIcon />
                  </a>
                  <a href="https://x.com/intent/tweet" aria-label="Share on X">
                    <X size={18} aria-hidden="true" />
                  </a>
                  <a href="https://pinterest.com/pin/create/button/" aria-label="Share on Pinterest">
                    <PinterestIcon />
                  </a>
                  <a href={`mailto:?subject=${encodeURIComponent(product.name)}`} aria-label="Share by email">
                    <Mail size={18} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="product-meta-list"
              variants={detailCopyItem}
              transition={{ duration: 0.52, ease: "easeOut" }}
            >
              <p>
                <strong>SKU:</strong> {product.sku || product.id || "N/A"}
              </p>
              <p>
                <strong>Barcode:</strong> {product.barcode || product.id || "N/A"}
              </p>
            </motion.div>

          </motion.aside>
        </section>

        <section className="product-detail-tabs">
          <div className="product-detail-tablist" role="tablist" aria-label="Product information">
            {detailSections.map((section) => (
              <button
                type="button"
                role="tab"
                key={section.key}
                aria-selected={activeTab === section.key}
                className={activeTab === section.key ? "is-active" : undefined}
                onClick={() => setActiveTab(section.key)}
              >
                {section.title}
              </button>
            ))}
          </div>
          <div className="product-detail-tabpanel" role="tabpanel">
            {activeTab === "description" ? (
              product.descriptionHtml ? (
                <div
                  className="product-description-content"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <p>{description}</p>
              )
            ) : null}
            {activeTab === "ingredients" ? (
              <p>See product packaging for the full ingredient and allergen information.</p>
            ) : null}
            {activeTab === "shipping" ? (
              <p>Orders are prepared quickly. Delivery times and returns depend on your location.</p>
            ) : null}
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="related-products">
            <div className="related-products-header">
              <h2>You may also like</h2>
              <a href="/all-products">View all</a>
            </div>
            <div className="related-products-grid">
              {relatedProducts.map((item) => (
                <a className="related-product-card" href={item.href ?? "#"} key={item.id ?? item.name}>
                  <span>
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 700px) 50vw, 220px" />
                  </span>
                  <small>{item.tag}</small>
                  <strong>{item.name}</strong>
                  <em>{item.price}</em>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="product-testimonials" id="reviews">
          <div className="product-testimonials-header">
            <h2>They love IronRoot</h2>
            <p>Refreshing reviews from real IronRoot lovers</p>
          </div>
          <div className="product-testimonials-grid">
            {displayReviews.map((review) => (
              <article className="product-testimonial-card" key={review.id}>
                <div className="product-testimonial-person">
                  <span className="product-testimonial-avatar" aria-hidden="true">
                    <span>{getInitials(review.name)}</span>
                  </span>
                  <div>
                    <strong>{review.name}</strong>
                    <span>{review.location}</span>
                  </div>
                </div>
                <blockquote>{review.quote}</blockquote>
                <div className="product-testimonial-stars" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} size={20} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </motion.main>
    </>
  );
}

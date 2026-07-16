"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  flavourTiles,
  heroImage,
  news,
  services,
  stats,
  type HomeProduct
} from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

const reveal = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09
    }
  }
};

const productReveal = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 }
};

const fitnessCopyStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

const fitnessCopyItem = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" }
};

const fitnessHeadingItem = {
  hidden: { opacity: 0, x: -36, filter: "blur(8px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)" }
};

type FlavourTile = (typeof flavourTiles)[number];

const founderImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/07/ChatGPT-Image-Jul-16-2026-04_08_17-PM.png";
const heroMobileImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-19-2026-12_54_24-PM.png";

function MotionSection({
  children,
  className,
  id
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      variants={reveal}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

function Hero() {
  return (
    <section className="hero-shell" aria-labelledby="hero-title">
      <motion.div
        className="hero"
        initial={false}
      >
        <div className="hero-image-layer">
          <Image
            src={heroImage}
            alt="IronRoot whey protein tubs on an orange splash background"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1440px"
            className="hero-image hero-image-desktop"
          />
          <Image
            src={heroMobileImage}
            alt="IronRoot supplement product hero"
            fill
            loading="eager"
            sizes="(max-width: 820px) calc(100vw - 20px), 1px"
            className="hero-image hero-image-mobile"
          />
        </div>
        <div className="hero-content">
          <motion.p
            className="eyebrow light"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
          >
            Premium supplements
          </motion.p>
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6 }}
          >
            Fuel your strength
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            Performance nutrition for serious training and everyday wellness.
          </motion.p>
          <motion.a
            href="#products"
            className="pill light"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.55 }}
          >
            Discover now
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

function readPrice(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDiscountPercent(product: HomeProduct) {
  const price = readPrice(product.price);
  const mrp = readPrice(product.mrp);

  if (price <= 0 || mrp <= price) {
    return 0;
  }

  return Math.round(((mrp - price) / mrp) * 100);
}
function ProductCard({ product, index }: { product: HomeProduct; index: number }) {
  const discountPercent = getDiscountPercent(product);
  return (
    <motion.article
      className="product-card"
      variants={productReveal}
      transition={{ duration: 0.55, delay: index * 0.02, ease: "easeOut" }}
    >
      <a className="product-media" href={product.href ?? "#products"} aria-label={product.name}>
        <span style={{ backgroundColor: product.tone }} />
        <motion.div
          className="product-image-motion"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <Image
            src={product.image}
            width={645}
            height={936}
            alt={product.name}
            loading="eager"
            quality={95}
            sizes="(max-width: 700px) 45vw, (max-width: 1100px) 20vw, 230px"
          />
        </motion.div>
      </a>
      <p>{product.tag}</p>
      <h3>{product.name}</h3>
      <div className="product-price-row">
        <strong>{product.price}</strong>
        {product.mrp && discountPercent > 0 ? (
          <>
            <span className="product-card-mrp">{product.mrp}</span>
            <span className="product-discount-badge">{discountPercent}% off</span>
          </>
        ) : null}
      </div>
    </motion.article>
  );
}

function FeaturedProducts({ products }: { products: HomeProduct[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionSection id="products" className="section-pad featured-products">
      <div className="section-header">
        <h2>Featured products</h2>
        <a href="/all-products" className="inline-link">
          View all <ChevronRight size={14} />
        </a>
      </div>
      <motion.div
        className="product-grid"
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.24 }}
        variants={stagger}
      >
        {products.map((product, index) => (
          <ProductCard key={product.id ?? product.name} product={product} index={index} />
        ))}
      </motion.div>
    </MotionSection>
  );
}

function normalizeProductMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findProductByAliases(products: HomeProduct[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeProductMatch);

  return products.find((product) => {
    const value = normalizeProductMatch(
      `${product.name} ${product.tag} ${product.slug ?? ""} ${product.sku ?? ""}`
    );

    return normalizedAliases.some((alias) => value.includes(alias));
  });
}

function getTileProduct(tile: FlavourTile, products: HomeProduct[]) {
  if ("aliases" in tile && Array.isArray(tile.aliases)) {
    return findProductByAliases(products, tile.aliases);
  }

  const title = tile.title.toLowerCase();
  const aliases = title.includes("tital") || title.includes("titan")
    ? ["tital meal", "titan meal", "meal mass gainer", "mass gainer"]
    : title.includes("pro fusion")
      ? ["pro fusion", "profusion"]
      : title.includes("pre shock")
        ? ["pre shock", "preshock", "pre-shock"]
        : [title];

  return findProductByAliases(products, aliases);
}

function FlavourTiles({ products }: { products: HomeProduct[] }) {
  return (
    <MotionSection className="flavour-section">
      <div className="flavour-grid">
        {flavourTiles.map((tile, index) => {
          const product = getTileProduct(tile, products);

          return (
            <FlavourTileCard
              key={tile.title}
              tile={tile}
              product={product}
              index={index}
            />
          );
        })}
      </div>
    </MotionSection>
  );
}

function FlavourTileCard({
  tile,
  product,
  index
}: {
  tile: FlavourTile;
  product?: HomeProduct;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const tileRef = useRef<HTMLElement>(null);
  const title = tile.title;
  const href = product?.href ?? tile.href;
  const { scrollYProgress } = useScroll({
    target: tileRef,
    offset: ["start end", "end start"]
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.article
      ref={tileRef}
      className="flavour-tile"
      variants={reveal}
      transition={{ duration: 0.55, delay: index * 0.08 }}
    >
      <a href={href} className="flavour-image" aria-label={title}>
        <motion.div
          className="flavour-image-layer"
          style={reduceMotion ? undefined : { y: imageY }}
        >
          <Image
            src={tile.image}
            alt={title}
            fill
            sizes="(max-width: 760px) 100vw, 33vw"
          />
        </motion.div>
        <div className="flavour-tile-footer mobile-overlay">
          <h3>{title}</h3>
          <span className="pill">Shop now</span>
        </div>
      </a>
      <div className="flavour-tile-footer desktop-footer">
        <h3>{title}</h3>
        <a className="pill" href={href}>
          Shop now
        </a>
      </div>
    </motion.article>
  );
}

function QuoteBand() {
  return (
    <MotionSection className="quote-band">
      <p>Fuel your training</p>
      <h2>
        "Strong workouts start with consistent nutrition, recovery, and hydration."
      </h2>
    </MotionSection>
  );
}

function FitnessBlock() {
  const reduceMotion = useReducedMotion();

  return (
    <MotionSection className="fitness-section">
      <motion.div
        className="fitness-copy"
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.45 }}
        variants={fitnessCopyStagger}
      >
        <motion.p
          className="eyebrow"
          variants={fitnessCopyItem}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Founder story
        </motion.p>
        <motion.h2
          variants={fitnessHeadingItem}
          transition={{ duration: 0.68, ease: "easeOut" }}
        >
          Built for training, shaped by discipline
        </motion.h2>
        <motion.p variants={fitnessCopyItem} transition={{ duration: 0.58, ease: "easeOut" }}>
          IronRoot started with a simple idea: make nutrition easy to carry, easy to
          trust, and strong enough to support daily training. What began as a gym-led
          routine became a supplement brand focused on consistency, recovery, and
          performance.
        </motion.p>
        <motion.div
          className="button-row"
          variants={fitnessCopyItem}
          transition={{ duration: 0.52, ease: "easeOut" }}
        >
          <a className="pill" href="#products">
            Shop supplements
          </a>
          <a className="pill outline" href="/founder-inspiring-story">
            Read more
          </a>
        </motion.div>
      </motion.div>
      <motion.figure
        className="fitness-image"
        whileHover={{ scale: 1.015 }}
        transition={{ duration: 0.25 }}
      >
        <Image
          src={founderImage}
          alt="Founder in a gray gym outfit"
          width={1200}
          height={760}
          sizes="(max-width: 900px) 100vw, 520px"
          unoptimized
        />
      </motion.figure>
    </MotionSection>
  );
}

function StrawberryFeature({ products }: { products: HomeProduct[] }) {
  const proteinPromoImage =
    "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/16.png";
  const proteinPromoMobileImage =
    "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/17.webp";
  const proFusionProduct = findProductByAliases(products, ["pro fusion", "profusion"]);
  const proFusionHref = proFusionProduct?.href ?? "/products/pro-fusion";
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"]
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [220, -360]);
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.32, 1],
    ["rgba(88, 38, 16, 0.18)", "rgb(88, 38, 16)", "rgb(64, 25, 10)"]
  );

  return (
    <MotionSection className="strawberry-feature">
      <div className="strawberry-stage" ref={stageRef}>
        <motion.span
          className="promo-background-text"
          aria-hidden="true"
          style={{ y: backgroundY, color: backgroundColor }}
        >
          Chocolate
        </motion.span>
        <motion.div
          className="strawberry-pack"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, delay: 0.1 }}
        >
          <Image
            src={proteinPromoImage}
            width={1080}
            height={858}
            alt="IronRoot protein promotion"
            sizes="100vw"
            className="promo-image-desktop"
            unoptimized
          />
          <Image
            src={proteinPromoMobileImage}
            width={1080}
            height={858}
            alt="IronRoot protein promotion"
            sizes="100vw"
            className="promo-image-mobile"
            unoptimized
          />
        </motion.div>
      </div>
      <p className="feature-caption">
        Premium protein support for training, recovery, and everyday nutrition.
      </p>
      <div className="button-row centered">
        <a className="pill" href={proFusionHref}>
          Shop now
        </a>
        <a className="pill outline" href="/all-products">
          All products
        </a>
      </div>
      <div className="stats-grid">
        {stats.map((item) => (
          <div key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </MotionSection>
  );
}

function SplitBenefit({ products }: { products: HomeProduct[] }) {
  const benefitImage =
    "https://admin.ironrootnutrition.com/wp-content/uploads/2026/07/ChatGPT-Image-Jul-1-2026-03_58_16-PM.png";
  const gainerProduct = findProductByAliases(products, ["titan meal", "big build", "mass gainer", "weight gainer"]);
  const gainerHref = gainerProduct?.href ?? "/all-products?category=mass-gainer";

  return (
    <MotionSection id="bottles" className="split-benefit">
      <figure>
        <Image
          src={benefitImage}
          alt="IronRoot mass gainer product display"
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
        />
      </figure>
      <div className="benefit-copy">
        <p className="eyebrow">Mass gainer support</p>
        <h2>High-calorie nutrition for steady gains</h2>
        <p>
          Dense, reliable gainer formulas built for athletes who need more calories,
          quality protein, and training-day fuel. Support your bulking phase with
          smooth nutrition that fits a consistent strength routine.
        </p>
        <a className="pill outline dark-text" href={gainerHref}>
          Shop Mass Gainer
        </a>
      </div>
    </MotionSection>
  );
}
function IceTeaBanner({ products }: { products: HomeProduct[] }) {
  const bannerImage =
    "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_12_46-PM.png";
  const glutamineProduct = findProductByAliases(products, ["glutamine"]);
  const glutamineHref = glutamineProduct?.href ?? "/all-products?category=glutamine";

  return (
    <MotionSection className="ice-banner">
      <Image
        src={bannerImage}
        alt="IronRoot glutamine product banner"
        fill
        sizes="(max-width: 760px) calc(100vw - 32px), calc(100vw - 84px)"
      />
      <div>
        <p className="eyebrow light">Strength essential</p>
        <h2>
          Glutamine
        </h2>
        <a className="pill light" href={glutamineHref}>
          Shop glutamine
        </a>
      </div>
    </MotionSection>
  );
}

function LatestNews() {
  return (
    <MotionSection id="blog" className="section-pad latest-news">
      <div className="section-header">
        <h2>Latest blogs</h2>
      </div>
      <div className="news-grid">
        {news.map((item, index) => (
          <motion.article
            key={item.title}
            className="news-card"
            variants={reveal}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ y: -7 }}
          >
            <a className="news-image" href={`/blog/${item.slug}`} aria-label={item.title}>
              {item.badge ? <span>{item.badge}</span> : null}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 760px) 100vw, 33vw"
              />
            </a>
            <h3>{item.title}</h3>
            <p>
              {item.date} <span>by {item.author}</span>
            </p>
            <a className="read-more" href={`/blog/${item.slug}`}>
              Read more <ArrowRight size={14} />
            </a>
          </motion.article>
        ))}
      </div>
    </MotionSection>
  );
}

function ServiceStrip() {
  return (
    <section className="service-strip" id="support">
      {services.map((service) => (
        <div key={service.title}>
          <Image src={service.icon} width={30} height={30} alt="" aria-hidden="true" />
          <h3>{service.title}</h3>
          <p>{service.text}</p>
        </div>
      ))}
    </section>
  );
}

export default function HomePage({
  products,
  catalogProducts,
  categories
}: {
  products: HomeProduct[];
  catalogProducts?: HomeProduct[];
  categories: WooCatalogCategory[];
}) {
  const productCatalog = catalogProducts?.length ? catalogProducts : products;

  return (
    <>
      <SiteHeader categories={categories} searchProducts={productCatalog} />
      <main>
        <Hero />
        <FeaturedProducts products={products} />
        <FlavourTiles products={productCatalog} />
        <QuoteBand />
        <FitnessBlock />
        <StrawberryFeature products={productCatalog} />
        <SplitBenefit products={productCatalog} />
        <IceTeaBanner products={productCatalog} />
        <LatestNews />
      </main>
    </>
  );
}

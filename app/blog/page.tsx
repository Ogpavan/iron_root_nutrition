import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { news } from "@/lib/home-data";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Blog | IronRoot Nutrition",
  description: "Simple IronRoot guides for protein, creatine, recovery, and daily training support.",
  alternates: {
    canonical: "/blog"
  }
};

export default async function BlogPage() {
  const [products, categories] = await Promise.all([getAllProducts(100, { includeVariations: true }), getWooCategories()]);

  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <main className="blog-list-page">
        <section className="blog-list-hero" aria-labelledby="blog-list-title">
          <p>IronRoot Blog</p>
          <h1 id="blog-list-title">Training notes that stay simple</h1>
          <span>
            Short, practical reads for protein timing, creatine use, recovery, and everyday supplement choices.
          </span>
        </section>

        <section className="blog-list-grid" aria-label="Blog topics">
          {news.map((article, index) => (
            <a className="blog-list-card" href={`/blog/${article.slug}`} key={article.slug}>
              <span className="blog-list-card-image">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 33vw"
                />
              </span>
              <span className="blog-card-meta">
                <span>{article.badge}</span>
                <span>{article.readTime}</span>
              </span>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <span className="read-more">
                Read article <ArrowRight size={14} aria-hidden="true" />
              </span>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}
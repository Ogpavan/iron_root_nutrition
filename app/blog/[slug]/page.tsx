import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { news } from "@/lib/home-data";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

type BlogPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getArticle(slug: string) {
  return news.find((article) => article.slug === slug);
}

export function generateStaticParams() {
  return news.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return {
      title: "Blog | IronRoot Nutrition"
    };
  }

  return {
    title: `${article.title} | IronRoot Nutrition`,
    description: article.excerpt,
    alternates: {
      canonical: `/blog/${article.slug}`
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [
        {
          url: article.image,
          alt: article.title
        }
      ]
    }
  };
}

export default async function Page({ params }: BlogPageProps) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const [products, categories] = await Promise.all([getAllProducts(100, { includeVariations: true }), getWooCategories()]);
  const relatedArticles = news.filter((item) => item.slug !== article.slug);

  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <main className="blog-detail-page">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <ChevronRight size={14} aria-hidden="true" />
          <a href="/blog">Blog</a>
          <ChevronRight size={14} aria-hidden="true" />
          <span>{article.badge}</span>
        </nav>

        <section className="blog-detail-hero" aria-labelledby="blog-title">
          <div className="blog-hero-copy">
            <p className="blog-kicker">{article.badge}</p>
            <h1 id="blog-title">{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="blog-meta-row" aria-label="Article details">
              <span>{article.date}</span>
              <span>by {article.author}</span>
              <span>{article.readTime}</span>
            </div>
          </div>

          <figure className="blog-detail-image">
            <Image src={article.image} alt={article.title} fill priority sizes="(max-width: 820px) 100vw, 1160px" />
          </figure>
        </section>

        <section className="blog-article-shell">
          <article className="blog-article">
            {article.sections.map((section) => (
              <section className="blog-section" key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>

          <aside className="blog-related" aria-labelledby="related-blog-title">
            <h2 id="related-blog-title">More reads</h2>
            {relatedArticles.map((item) => (
              <a className="blog-related-card" href={`/blog/${item.slug}`} key={item.slug}>
                <span className="blog-related-image">
                  <Image src={item.image} alt="" fill sizes="82px" />
                </span>
                <span>
                  <em>{item.badge}</em>
                  <strong>{item.title}</strong>
                </span>
              </a>
            ))}
          </aside>
        </section>
      </main>
    </>
  );
}
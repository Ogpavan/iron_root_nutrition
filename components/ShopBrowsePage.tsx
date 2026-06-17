import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type BrowseItem = {
  title: string;
  href: string;
  image: string;
};

type ShopBrowsePageProps = {
  title: string;
  eyebrow: string;
  categories: WooCatalogCategory[];
  items: BrowseItem[];
};

export default function ShopBrowsePage({
  title,
  eyebrow,
  categories,
  items
}: ShopBrowsePageProps) {
  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className="shop-browse-page">
        <section className="shop-browse-hero">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </section>

        <section className="shop-browse-grid" aria-label={title}>
          {items.map((item) => (
            <a className="shop-browse-card" href={item.href} key={item.title}>
              <span className="shop-browse-image">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 720px) 42vw, (max-width: 1100px) 24vw, 180px"
                />
              </span>
              <span>{item.title}</span>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}

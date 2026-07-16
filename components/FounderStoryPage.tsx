"use client";

import { ArrowRight, ChevronRight, Dumbbell, Flame, ShieldCheck } from "lucide-react";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import type { HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type FounderStoryPageProps = {
  categories: WooCatalogCategory[];
  products: HomeProduct[];
};

const founderImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/07/ChatGPT-Image-Jul-16-2026-04_08_17-PM.png";

const storyPillars = [
  {
    title: "Training first",
    text: "The brand started inside a daily gym routine, where nutrition had to be practical enough to use consistently.",
    icon: Dumbbell
  },
  {
    title: "Trust in every scoop",
    text: "IronRoot keeps the focus on formulas that are easy to understand, easy to carry, and built around real recovery needs.",
    icon: ShieldCheck
  },
  {
    title: "Discipline over shortcuts",
    text: "Progress comes from repeatable habits: train well, recover well, and fuel the body with intent.",
    icon: Flame
  }
];

export default function FounderStoryPage({ categories, products }: FounderStoryPageProps) {
  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <main className="founder-story-page">
        <section className="founder-story-hero" aria-labelledby="founder-story-title">
          <div className="founder-story-copy">
            <p>Founder story</p>
            <h1 id="founder-story-title">Built for training, shaped by discipline</h1>
            <span>
              IronRoot started with a simple idea: make nutrition easy to carry, easy to
              trust, and strong enough to support daily training.
            </span>
            <div className="founder-story-actions">
              <a className="pill" href="/all-products">
                Shop supplements
              </a>
              <a className="pill outline" href="#story">
                Read the story
              </a>
            </div>
          </div>
          <figure className="founder-story-image">
            <Image
              src={founderImage}
              alt="IronRoot founder in training apparel"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 48vw"
              unoptimized
            />
          </figure>
        </section>

        <nav className="founder-story-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Homepage</a>
          <ChevronRight aria-hidden="true" size={14} />
          <span>Founder inspiring story</span>
        </nav>

        <section className="founder-story-body" id="story">
          <article>
            <p className="eyebrow">The beginning</p>
            <h2>From routine to responsibility</h2>
            <p>
              What began as a gym-led routine became a supplement brand focused on
              consistency, recovery, and performance. The idea was never to chase noise.
              It was to build something dependable for people who show up, train hard,
              and need nutrition that fits their day.
            </p>
            <p>
              IronRoot is shaped by discipline: the kind that repeats when motivation is
              low, schedules are tight, and progress feels slow. Every product direction
              starts from that mindset.
            </p>
          </article>

          <div className="founder-story-pillars" aria-label="IronRoot principles">
            {storyPillars.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title}>
                  <Icon size={24} aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>

          <section className="founder-story-cta" aria-label="Shop IronRoot supplements">
            <div>
              <p>Carry the routine forward</p>
              <h2>Fuel your next training day</h2>
            </div>
            <a className="pill light" href="/all-products">
              Shop supplements <ArrowRight size={15} aria-hidden="true" />
            </a>
          </section>
        </section>
      </main>
    </>
  );
}

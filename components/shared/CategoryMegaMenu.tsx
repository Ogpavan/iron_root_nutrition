"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type CategoryMegaMenuProps = {
  categories: WooCatalogCategory[];
  open: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function CategoryMegaMenu({
  categories,
  open,
  onMouseEnter,
  onMouseLeave
}: CategoryMegaMenuProps) {
  const visibleCategories = categories.filter((category) => {
    const normalized = `${category.name} ${category.slug}`.toLowerCase();

    return !normalized.includes("multivitamin") && !normalized.includes("liver-axis") && !normalized.includes("liver axis");
  });

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`category-mega${open ? " is-open" : ""}`}
      role="menu"
      aria-label="Shop by category"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="category-mega-top">
        <div className="category-mega-intro">
          <h2>Browse category</h2>
        </div>
        <a className="category-view-all" href="/all-products">
          View all <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="category-mega-grid" style={{ "--category-count": visibleCategories.length } as CSSProperties}>
        {visibleCategories.map((category) => (
          <a
            key={category.slug}
            className="category-mega-card"
            href={category.href}
            role="menuitem"
          >
            <span className="category-mega-image">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 1100px) 16vw, 160px"
              />
            </span>
            <span className="category-mega-name">{category.name}</span>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { concernItems } from "@/lib/home-data";

type ConcernMegaMenuProps = {
  open: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function ConcernMegaMenu({ open, onMouseEnter, onMouseLeave }: ConcernMegaMenuProps) {
  return (
    <motion.div
      className={`category-mega concern-mega${open ? " is-open" : ""}`}
      role="menu"
      aria-label="Shop by concern"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="category-mega-top">
        <div className="category-mega-intro">
          <h2>Browse by concern</h2>
        </div>
        <a className="category-view-all" href="/all-products">
          View all <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="concern-mega-grid">
        {concernItems.map((item) => (
          <a
            key={item.title}
            className="category-mega-card concern-mega-card"
            href={item.href}
            role="menuitem"
          >
            <span className="category-mega-image">
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 1100px) 16vw, 160px" />
            </span>
            <span className="category-mega-name">{item.title}</span>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const announcements = [
  <>Free delivery on orders over ₹3,500</>,
  <>Buy now, pay later</>,
  <>14-day return policy. More info</>
];

type TopHeaderStripProps = {
  supportHref?: string;
};

export default function TopHeaderStrip({ supportHref = "/support" }: TopHeaderStripProps) {
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnnouncementIndex((index) => (index + 1) % announcements.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="utility-bar">
      <div className="announcement-slot" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={announcementIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {announcements[announcementIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <a className="utility-support" href={supportHref}>
        Support
      </a>
    </div>
  );
}

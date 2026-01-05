"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export function MediaGrid({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const items = React.Children.toArray(children);

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
    >
      {items.map((child, idx) => (
        <motion.div
          key={(child as any)?.key ?? idx}
          variants={prefersReducedMotion ? undefined : itemVariants}
          layout
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

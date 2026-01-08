"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrollableTabsProps {
  children: React.ReactNode;
  className?: string;
  fadeColor?: string; // Optional hex or css var for fade, defaults to background
}

export function ScrollableTabs({ children, className }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll position to toggle fades
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Tolerance of 2px
    setShowLeftFade(scrollLeft > 2);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  // Also check on mount/children change
  useEffect(() => {
     checkScroll();
  }, [children]);

  return (
    <div className={cn("relative group", className)}>
      {/* Left Fade */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-300",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex min-w-full gap-2 px-1">
          {children}
        </div>
      </div>

      {/* Right Fade */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-300",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
    </div>
  );
}

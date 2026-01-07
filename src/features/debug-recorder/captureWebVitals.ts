import { pushEvent } from "./store";
import type { WebVitalEvent, CLSSource } from "./types";

// =========================
// Web Vitals Capture
// =========================
// Uses native PerformanceObserver API (no external deps)

let isInstalled = false;
let observers: PerformanceObserver[] = [];

// CLS per-route tracking
let currentRoute: string | null = null;
let clsResetCallback: (() => void) | null = null;

type WebVitalName = WebVitalEvent["name"];

interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  sources?: CLSSource[];
}

// Rating thresholds based on Core Web Vitals
const THRESHOLDS: Record<WebVitalName, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function getRating(name: WebVitalName, value: number): "good" | "needs-improvement" | "poor" {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function reportMetric(metric: WebVitalMetric): void {
  pushEvent({
    type: "web-vital",
    name: metric.name,
    value: Math.round(metric.value * 100) / 100,
    rating: metric.rating ?? getRating(metric.name, metric.value),
    delta: metric.delta,
    sources: metric.sources,
  } satisfies Omit<WebVitalEvent, "id" | "timestamp">);
}

// =========================
// LCP - Largest Contentful Paint
// =========================

function observeLCP(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportMetric({ name: "LCP", value: lastEntry.startTime });
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    return observer;
  } catch {
    return null;
  }
}

// =========================
// FCP - First Contentful Paint
// =========================

function observeFCP(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntriesByName("first-contentful-paint");
      if (entries.length > 0) {
        const entry = entries[0] as PerformanceEntry & { startTime: number };
        reportMetric({ name: "FCP", value: entry.startTime });
      }
    });
    observer.observe({ type: "paint", buffered: true });
    return observer;
  } catch {
    return null;
  }
}

// =========================
// CLS - Cumulative Layout Shift
// =========================

// Types for Layout Shift API
interface LayoutShiftAttribution {
  node?: Node | null;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: LayoutShiftAttribution[];
}

function extractCLSSources(entries: LayoutShiftEntry[]): CLSSource[] {
  const sources: CLSSource[] = [];

  for (const entry of entries) {
    if (!entry.sources) continue;

    for (const source of entry.sources) {
      if (!source.node || !(source.node instanceof Element)) continue;

      const el = source.node as Element;
      sources.push({
        tagName: el.tagName.toLowerCase(),
        className: el.className?.toString?.() || "",
        id: el.id || undefined,
        prevRect: {
          x: Math.round(source.previousRect.x),
          y: Math.round(source.previousRect.y),
          width: Math.round(source.previousRect.width),
          height: Math.round(source.previousRect.height),
        },
        currentRect: {
          x: Math.round(source.currentRect.x),
          y: Math.round(source.currentRect.y),
          width: Math.round(source.currentRect.width),
          height: Math.round(source.currentRect.height),
        },
      });
    }
  }

  // Return top 3 sources (by shift magnitude)
  return sources
    .sort((a, b) => {
      const shiftA = Math.abs(a.currentRect.y - a.prevRect.y) + Math.abs(a.currentRect.x - a.prevRect.x);
      const shiftB = Math.abs(b.currentRect.y - b.prevRect.y) + Math.abs(b.currentRect.x - b.prevRect.x);
      return shiftB - shiftA;
    })
    .slice(0, 3);
}

function observeCLS(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: LayoutShiftEntry[] = [];
  let reportTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastReportedValue = -1;

  // Expose reset function for route changes
  clsResetCallback = () => {
    // Report final CLS for previous route if significant
    if (clsValue > 0.001 && currentRoute) {
      const sources = extractCLSSources(sessionEntries);
      reportMetric({
        name: "CLS",
        value: clsValue,
        sources,
        // Include route info in the metric
      });
    }
    // Reset accumulators
    clsValue = 0;
    sessionValue = 0;
    sessionEntries = [];
    lastReportedValue = -1;
    if (reportTimeout) {
      clearTimeout(reportTimeout);
      reportTimeout = null;
    }
  };

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (
            sessionValue &&
            firstSessionEntry &&
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
          }
        }
      }

      // Debounce: wait 500ms of inactivity before reporting
      // This prevents spam when multiple shifts happen quickly
      if (reportTimeout) clearTimeout(reportTimeout);
      reportTimeout = setTimeout(() => {
        // Only report if value changed significantly (avoid duplicate reports)
        if (Math.abs(clsValue - lastReportedValue) > 0.001) {
          lastReportedValue = clsValue;
          const sources = extractCLSSources(sessionEntries);
          reportMetric({ name: "CLS", value: clsValue, sources });
        }
      }, 500);
    });
    observer.observe({ type: "layout-shift", buffered: true });
    return observer;
  } catch {
    return null;
  }
}

// =========================
// INP - Interaction to Next Paint
// =========================

function observeINP(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  let maxINP = 0;
  let reportTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastReportedValue = -1;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { duration: number })[]) {
        if (entry.duration > maxINP) {
          maxINP = entry.duration;
        }
      }

      // Debounce: wait 300ms before reporting
      if (reportTimeout) clearTimeout(reportTimeout);
      reportTimeout = setTimeout(() => {
        if (maxINP !== lastReportedValue) {
          lastReportedValue = maxINP;
          reportMetric({ name: "INP", value: maxINP });
        }
      }, 300);
    });
    observer.observe({ type: "event", buffered: true });
    return observer;
  } catch {
    return null;
  }
}

// =========================
// TTFB - Time to First Byte
// =========================

function observeTTFB(): void {
  if (typeof performance === "undefined") return;

  try {
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      if (ttfb > 0) {
        reportMetric({ name: "TTFB", value: ttfb });
      }
    }
  } catch {
    // Ignore errors
  }
}

// =========================
// Install/Uninstall
// =========================

export function installWebVitalsCapture(): void {
  if (typeof window === "undefined" || isInstalled) return;

  isInstalled = true;

  // Start observers
  const lcpObs = observeLCP();
  const fcpObs = observeFCP();
  const clsObs = observeCLS();
  const inpObs = observeINP();

  if (lcpObs) observers.push(lcpObs);
  if (fcpObs) observers.push(fcpObs);
  if (clsObs) observers.push(clsObs);
  if (inpObs) observers.push(inpObs);

  // TTFB is one-time
  observeTTFB();
}

export function uninstallWebVitalsCapture(): void {
  if (!isInstalled) return;

  observers.forEach((obs) => obs.disconnect());
  observers = [];
  isInstalled = false;
  clsResetCallback = null;
  currentRoute = null;
}

// =========================
// CLS Per-Route Tracking
// =========================

/**
 * Call this on route change to reset CLS accumulator
 * Reports final CLS for previous route before resetting
 */
export function onRouteChange(newRoute: string): void {
  // Skip if same route
  if (newRoute === currentRoute) return;

  // Reset CLS for new route
  if (clsResetCallback) {
    clsResetCallback();
  }

  currentRoute = newRoute;
}

/**
 * Get current route being tracked
 */
export function getCurrentCLSRoute(): string | null {
  return currentRoute;
}

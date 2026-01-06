import { pushEvent } from "./store";
import type { WebVitalEvent } from "./types";

// =========================
// Web Vitals Capture
// =========================
// Uses native PerformanceObserver API (no external deps)

let isInstalled = false;
let observers: PerformanceObserver[] = [];

type WebVitalName = WebVitalEvent["name"];

interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
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

function observeCLS(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];
  let reportTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastReportedValue = -1;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0] as (PerformanceEntry & { startTime: number }) | undefined;
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as (PerformanceEntry & { startTime: number }) | undefined;

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
          reportMetric({ name: "CLS", value: clsValue });
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
}

"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pushEvent } from "./store";
import type { RouteRenderEvent } from "./types";

// =========================
// Route Render Timing Hook
// =========================

let previousRoute: string | null = null;

export function useRouteRenderCapture(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const search = searchParams.toString();
    const currentRoute = pathname + (search ? `?${search}` : "");

    // Skip initial mount if same route
    if (previousRoute === currentRoute) return;

    const fromRoute = previousRoute;
    previousRoute = currentRoute;

    // Mark start of route change
    startTimeRef.current = performance.now();
    performance.mark("gh:route:start");

    // Use double RAF to catch "first stable paint"
    // First RAF: after JS execution, before paint
    // Second RAF: after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (startTimeRef.current === null) return;

        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTimeRef.current);

        performance.mark("gh:route:end");

        try {
          performance.measure("gh:route:render", "gh:route:start", "gh:route:end");
        } catch {
          // Ignore if marks don't exist
        }

        pushEvent({
          type: "route-render",
          route: currentRoute,
          durationMs,
          meta: {
            fromRoute: fromRoute ?? undefined,
            search: search || undefined,
          },
        } satisfies Omit<RouteRenderEvent, "id" | "timestamp">);

        // Clear marks
        try {
          performance.clearMarks("gh:route:start");
          performance.clearMarks("gh:route:end");
          performance.clearMeasures("gh:route:render");
        } catch {
          // Ignore
        }

        startTimeRef.current = null;
      });
    });
  }, [pathname, searchParams]);
}

// =========================
// Route Render Capture Component
// =========================

export function RouteRenderCapture(): null {
  useRouteRenderCapture();
  return null;
}

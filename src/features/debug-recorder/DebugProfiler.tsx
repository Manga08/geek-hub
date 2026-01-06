"use client";

import * as React from "react";
import { Profiler, ProfilerOnRenderCallback } from "react";
import { pushEvent } from "./store";
import type { RenderEvent } from "./types";

// =========================
// Throttle Map per Component
// =========================

const lastRenderTime = new Map<string, number>();
const THROTTLE_MS = 100; // Min time between render events per component

// =========================
// Profiler onRender Handler
// =========================

const handleRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // Throttle per component
  const now = Date.now();
  const lastTime = lastRenderTime.get(id) ?? 0;
  if (now - lastTime < THROTTLE_MS) return;
  lastRenderTime.set(id, now);

  pushEvent({
    type: "render",
    componentId: id,
    phase: phase as "mount" | "update",
    actualDurationMs: Math.round(actualDuration * 100) / 100,
    baseDurationMs: Math.round(baseDuration * 100) / 100,
    startTime: Math.round(startTime * 100) / 100,
    commitTime: Math.round(commitTime * 100) / 100,
  } satisfies Omit<RenderEvent, "id" | "timestamp">);
};

// =========================
// Debug Profiler Component
// =========================

interface DebugProfilerProps {
  id: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export function DebugProfiler({ id, children, enabled = true }: DebugProfilerProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}

// =========================
// Named Profilers for common components
// =========================

export function ProfiledNavbar({ children }: { children: React.ReactNode }) {
  return <DebugProfiler id="Navbar">{children}</DebugProfiler>;
}

export function ProfiledPageTransition({ children }: { children: React.ReactNode }) {
  return <DebugProfiler id="PageTransition">{children}</DebugProfiler>;
}

export function ProfiledMain({ children }: { children: React.ReactNode }) {
  return <DebugProfiler id="Main">{children}</DebugProfiler>;
}

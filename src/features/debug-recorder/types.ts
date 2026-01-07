// =========================
// Debug Recorder Types
// =========================

export type DebugEventType =
  | "fetch"
  | "error"
  | "warn"
  | "log"
  | "info"
  | "query"
  | "web-vital"
  | "route-render"
  | "render"
  | "server-log";

export interface DebugEventBase {
  id: string;
  type: DebugEventType;
  timestamp: number;
}

export interface FetchEvent extends DebugEventBase {
  type: "fetch";
  method: string;
  url: string;
  status: number;
  durationMs: number;
  ok: boolean;
  errorId?: string; // Correlation with server errors
}

export interface ConsoleEvent extends DebugEventBase {
  type: "error" | "warn" | "log" | "info";
  message: string;
  stack?: string;
}

export interface QueryEvent extends DebugEventBase {
  type: "query";
  queryKey: string;
  action: "start" | "success" | "error";
  durationMs?: number;
  error?: string;
  // New: additional query metadata
  stale?: boolean;
  dataUpdatedAt?: number;
}

// =========================
// New: Render Timing Events
// =========================

export interface CLSSource {
  tagName: string;
  className: string;
  id?: string;
  prevRect: { x: number; y: number; width: number; height: number };
  currentRect: { x: number; y: number; width: number; height: number };
}

export interface WebVitalEvent extends DebugEventBase {
  type: "web-vital";
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
  sources?: CLSSource[]; // Top 3 CLS sources
}

export interface RouteRenderEvent extends DebugEventBase {
  type: "route-render";
  route: string;
  durationMs: number;
  meta?: {
    fromRoute?: string;
    search?: string;
  };
}

export interface RenderEvent extends DebugEventBase {
  type: "render";
  componentId: string;
  phase: "mount" | "update";
  actualDurationMs: number;
  baseDurationMs: number;
  startTime: number;
  commitTime: number;
}

// =========================
// New: Server Log Event
// =========================

export interface ServerLogEvent extends DebugEventBase {
  type: "server-log";
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  route?: string;
  errorId?: string;
}

export type DebugEvent =
  | FetchEvent
  | ConsoleEvent
  | QueryEvent
  | WebVitalEvent
  | RouteRenderEvent
  | RenderEvent
  | ServerLogEvent;

export type DebugFilter =
  | "all"
  | "fetch"
  | "error"
  | "warn"
  | "log"
  | "info"
  | "query"
  | "render"
  | "server-log";

// =========================
// Snapshot Types for Inspectors
// =========================

export interface RQQueryState {
  queryKey: string;
  state: "fresh" | "stale" | "fetching" | "paused" | "inactive";
  dataUpdatedAt?: number;
  errorUpdatedAt?: number;
  fetchStatus: "idle" | "fetching" | "paused";
  isStale: boolean;
  isInvalidated: boolean;
}

export interface AuthSnapshot {
  userId: string | null;
  email: string | null;
  groupId: string | null;
  groupName: string | null;
  role: string | null;
  expiresAt: number | null;
}

export interface StorageSnapshot {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

// =========================
// Constants
// =========================

export const DEBUG_STORAGE_KEY = "GH_DEBUG";
export const DEBUG_EVENTS_KEY = "GH_DEBUG_EVENTS";
export const MAX_EVENTS = 500;
export const MAX_RENDER_EVENTS = 200;

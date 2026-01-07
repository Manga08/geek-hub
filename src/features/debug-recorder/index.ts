// =========================
// Debug Recorder Feature
// =========================

export { DebugProvider } from "./DebugProvider";
export { DebugPanel } from "./DebugPanel";
export { DebugProfiler, ProfiledNavbar, ProfiledPageTransition, ProfiledMain } from "./DebugProfiler";

export type {
  DebugEvent,
  DebugEventType,
  DebugFilter,
  FetchEvent,
  ConsoleEvent,
  WebVitalEvent,
  RouteRenderEvent,
  RenderEvent,
  ServerLogEvent,
  CLSSource,
  RQQueryState,
  AuthSnapshot,
  StorageSnapshot,
} from "./types";
export { DEBUG_STORAGE_KEY, DEBUG_EVENTS_KEY, MAX_EVENTS, MAX_RENDER_EVENTS } from "./types";

export { pushEvent, clearEvents, getAllEvents, exportEventsAsJSON } from "./store";

// CLS per-route tracking
export { onRouteChange, getCurrentCLSRoute } from "./captureWebVitals";

// Inspectors
export {
  getRQSnapshot,
  formatRQSnapshot,
  getAuthSnapshot,
  formatAuthSnapshot,
  getStorageSnapshot,
  formatStorageSnapshot,
} from "./inspectors";

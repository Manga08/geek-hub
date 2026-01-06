import {
  DebugEvent,
  FetchEvent,
  ConsoleEvent,
  QueryEvent,
  WebVitalEvent,
  RouteRenderEvent,
  RenderEvent,
  ServerLogEvent,
  DEBUG_EVENTS_KEY,
  MAX_EVENTS,
  MAX_RENDER_EVENTS,
} from "./types";

// =========================
// Event Input Types (without id/timestamp)
// =========================

type FetchEventInput = Omit<FetchEvent, "id" | "timestamp">;
type ConsoleEventInput = Omit<ConsoleEvent, "id" | "timestamp">;
type QueryEventInput = Omit<QueryEvent, "id" | "timestamp">;
type WebVitalEventInput = Omit<WebVitalEvent, "id" | "timestamp">;
type RouteRenderEventInput = Omit<RouteRenderEvent, "id" | "timestamp">;
type RenderEventInput = Omit<RenderEvent, "id" | "timestamp">;
type ServerLogEventInput = Omit<ServerLogEvent, "id" | "timestamp">;

type DebugEventInput =
  | FetchEventInput
  | ConsoleEventInput
  | QueryEventInput
  | WebVitalEventInput
  | RouteRenderEventInput
  | RenderEventInput
  | ServerLogEventInput;

// =========================
// In-Memory Store
// =========================

let events: DebugEvent[] = [];
const listeners: Set<() => void> = new Set();

// =========================
// Batched Async Notification
// =========================

let notifyScheduled = false;

function scheduleNotify(): void {
  if (notifyScheduled) return; // Already scheduled, will batch
  notifyScheduled = true;

  // Use queueMicrotask for async notification (avoids setState-during-render)
  const schedule = typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn: () => void) => Promise.resolve().then(fn);

  schedule(() => {
    notifyScheduled = false;
    listeners.forEach((fn) => fn());
  });
}

// =========================
// Generate Unique ID
// =========================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// =========================
// LocalStorage Sync
// =========================

function loadFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(DEBUG_EVENTS_KEY);
    if (stored) {
      events = JSON.parse(stored);
    }
  } catch {
    events = [];
  }
}

function saveToStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEBUG_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Storage full or unavailable
  }
}

// =========================
// Public API
// =========================

export function initStore(): void {
  loadFromStorage();
}

export function pushEvent(event: DebugEventInput): void {
  const fullEvent = {
    ...event,
    id: generateId(),
    timestamp: Date.now(),
  } as DebugEvent;

  events.push(fullEvent);

  // Trim render events separately to avoid spam
  const renderEvents = events.filter(e => e.type === "render");
  if (renderEvents.length > MAX_RENDER_EVENTS) {
    const toRemove = renderEvents.slice(0, renderEvents.length - MAX_RENDER_EVENTS);
    const toRemoveIds = new Set(toRemove.map(e => e.id));
    events = events.filter(e => !toRemoveIds.has(e.id));
  }

  // Trim overall if over limit
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }

  saveToStorage();
  scheduleNotify(); // Async notification to avoid setState-during-render
}

export function clearEvents(): void {
  events = [];
  saveToStorage();
  scheduleNotify(); // Async notification
}

export function getAllEvents(): DebugEvent[] {
  return [...events];
}

export function getServerLogIds(): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.type === "server-log" && e.errorId) {
      ids.add(e.errorId);
    }
  }
  return ids;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// =========================
// Export Helper for JSON
// =========================

export function exportEventsAsJSON(): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalEvents: events.length,
    events: events,
  };
  return JSON.stringify(exportData, null, 2);
}

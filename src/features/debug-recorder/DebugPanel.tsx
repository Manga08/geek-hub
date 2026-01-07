"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DebugEvent,
  DebugFilter,
  FetchEvent,
  ConsoleEvent,
  WebVitalEvent,
  RouteRenderEvent,
  RenderEvent,
  ServerLogEvent,
} from "./types";
import {
  getAllEvents,
  clearEvents,
  subscribe,
} from "./store";
import {
  getRQSnapshot,
  formatRQSnapshot,
  getAuthSnapshot,
  formatAuthSnapshot,
  getStorageSnapshot,
  formatStorageSnapshot,
} from "./inspectors";
import { useQueryClient } from "@tanstack/react-query";

// =========================
// Tab Types
// =========================

type TabType = "all" | "events" | "render" | "server" | "inspect";

// =========================
// Filter Buttons for Events tab
// =========================

const EVENT_FILTERS: { label: string; value: DebugFilter }[] = [
  { label: "All", value: "all" },
  { label: "API", value: "fetch" },
  { label: "Errors", value: "error" },
  { label: "Warns", value: "warn" },
  { label: "Query", value: "query" },
];

// =========================
// Event Row Components
// =========================

function FetchEventRow({ event }: { event: FetchEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const statusColor = event.ok ? "text-green-400" : "text-red-400";

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
          {event.method}
        </span>
        <span className={statusColor}>{event.status}</span>
        <span className="text-muted-foreground">{event.durationMs}ms</span>
        {event.errorId && (
          <span className="px-1 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px]">
            #{event.errorId.slice(-6)}
          </span>
        )}
      </div>
      <div className="text-foreground truncate mt-1">{event.url}</div>
    </div>
  );
}

function ConsoleEventRow({ event }: { event: ConsoleEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const colorClass = event.type === "error" ? "text-red-400" : "text-yellow-400";
  const bgClass = event.type === "error" ? "bg-red-500/20" : "bg-yellow-500/20";

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className={`px-1.5 py-0.5 rounded ${bgClass} ${colorClass} text-[10px] uppercase`}>
          {event.type}
        </span>
      </div>
      <div className={`${colorClass} mt-1 break-all`}>{event.message}</div>
    </div>
  );
}

function WebVitalRow({ event }: { event: WebVitalEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const ratingColors = {
    good: "text-green-400 bg-green-500/20",
    "needs-improvement": "text-yellow-400 bg-yellow-500/20",
    poor: "text-red-400 bg-red-500/20",
  };
  const ratingClass = event.rating ? ratingColors[event.rating] : "text-muted-foreground bg-white/10";

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px]">
          {event.name}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${ratingClass} text-[10px]`}>
          {event.value.toFixed(event.name === "CLS" ? 3 : 0)}
          {event.name !== "CLS" && "ms"}
        </span>
        {event.rating && (
          <span className="text-muted-foreground text-[10px]">{event.rating}</span>
        )}
      </div>
      {/* CLS Sources - show what elements shifted */}
      {event.name === "CLS" && event.sources && event.sources.length > 0 && (
        <div className="mt-1.5 pl-2 border-l-2 border-cyan-500/30">
          <div className="text-[10px] text-muted-foreground mb-1">Shifted elements:</div>
          {event.sources.map((src, i) => (
            <div key={i} className="text-[10px] text-cyan-300/80 mb-0.5">
              <span className="text-cyan-400">&lt;{src.tagName}</span>
              {src.id && <span className="text-orange-400">#{src.id}</span>}
              {src.className && <span className="text-yellow-400">.{src.className.split(" ")[0]}</span>}
              <span className="text-cyan-400">&gt;</span>
              <span className="text-muted-foreground ml-2">
                y: {src.prevRect.y}→{src.currentRect.y} 
                {" "}(Δ{src.currentRect.y - src.prevRect.y}px)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteRenderRow({ event }: { event: RouteRenderEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const isSlowRender = event.durationMs > 100;

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
          ROUTE
        </span>
        <span className={isSlowRender ? "text-orange-400" : "text-green-400"}>
          {event.durationMs}ms
        </span>
      </div>
      <div className="text-foreground truncate mt-1">{event.route}</div>
      {event.meta?.fromRoute && (
        <div className="text-muted-foreground text-[10px] mt-0.5">
          from: {event.meta.fromRoute}
        </div>
      )}
    </div>
  );
}

function ComponentRenderRow({ event }: { event: RenderEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const isSlowRender = event.actualDurationMs > 16;

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px]">
          {event.phase.toUpperCase()}
        </span>
        <span className="text-foreground">{event.componentId}</span>
        <span className={isSlowRender ? "text-orange-400" : "text-green-400"}>
          {event.actualDurationMs.toFixed(1)}ms
        </span>
      </div>
    </div>
  );
}

function ServerLogRow({ event }: { event: ServerLogEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const levelColors = {
    error: "text-red-400 bg-red-500/20",
    warn: "text-yellow-400 bg-yellow-500/20",
    info: "text-blue-400 bg-blue-500/20",
  };

  return (
    <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{time}</span>
        <span className={`px-1.5 py-0.5 rounded ${levelColors[event.level]} text-[10px] uppercase`}>
          {event.level}
        </span>
        {event.errorId && (
          <span className="px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px]">
            #{event.errorId.slice(-6)}
          </span>
        )}
      </div>
      <div className="text-foreground mt-1 break-all">{event.message}</div>
      {event.route && (
        <div className="text-muted-foreground text-[10px] mt-0.5">
          route: {event.route}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: DebugEvent }) {
  switch (event.type) {
    case "fetch":
      return <FetchEventRow event={event} />;
    case "error":
    case "warn":
      return <ConsoleEventRow event={event} />;
    case "web-vital":
      return <WebVitalRow event={event} />;
    case "route-render":
      return <RouteRenderRow event={event} />;
    case "render":
      return <ComponentRenderRow event={event} />;
    case "server-log":
      return <ServerLogRow event={event} />;
    case "query":
      return (
        <div className="border-b border-white/10 py-2 px-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
              QUERY
            </span>
            <span className="text-muted-foreground">{event.action}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// =========================
// Debug Panel Component
// =========================

// Server logs fetch helper (returns new logs only)
async function fetchServerLogsFromAPI(): Promise<ServerLogEvent[]> {
  try {
    const res = await fetch("/api/debug/server-logs?limit=200", {
      headers: { "x-gh-debug": "1" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const logs = json.data?.logs ?? [];
    return logs.map((log: Record<string, unknown>) => ({
      type: "server-log" as const,
      level: log.level as "error" | "warn" | "info",
      message: String(log.message || ""),
      stack: log.stack as string | undefined,
      route: log.route as string | undefined,
      errorId: log.errorId as string | undefined,
      id: String(log.id || `server-${Date.now()}-${Math.random()}`),
      timestamp: Number(log.timestamp) || Date.now(),
    }));
  } catch {
    return [];
  }
}

export function DebugPanel() {
  const [open, setOpen] = React.useState(false);
  const [events, setEvents] = React.useState<DebugEvent[]>([]);
  const [filter, setFilter] = React.useState<DebugFilter>("all");
  const [tab, setTab] = React.useState<TabType>("all");
  const [copied, setCopied] = React.useState(false);
  const [fetchingServer, setFetchingServer] = React.useState(false);
  const [serverLogs, setServerLogs] = React.useState<ServerLogEvent[]>([]);

  // Inspector state
  const [inspectView, setInspectView] = React.useState<"rq" | "auth" | "storage">("rq");
  const [inspectData, setInspectData] = React.useState<string>("");
  const queryClient = useQueryClient();

  // Subscribe to store updates
  React.useEffect(() => {
    setEvents(getAllEvents());
    return subscribe(() => setEvents(getAllEvents()));
  }, []);

  // Refresh inspector data when tab changes to "inspect"
  React.useEffect(() => {
    if (tab !== "inspect") return;

    const refreshInspect = async () => {
      if (inspectView === "rq") {
        const snapshot = getRQSnapshot(queryClient);
        setInspectData(formatRQSnapshot(snapshot));
      } else if (inspectView === "auth") {
        const snapshot = await getAuthSnapshot();
        setInspectData(formatAuthSnapshot(snapshot));
      } else if (inspectView === "storage") {
        const snapshot = getStorageSnapshot();
        setInspectData(formatStorageSnapshot(snapshot));
      }
    };

    refreshInspect();
  }, [tab, inspectView, queryClient]);

  // Merge store events with fetched server logs (deduplicated)
  const allEventsWithServer = React.useMemo(() => {
    // Use errorId + timestamp as key for deduplication
    const seen = new Set<string>();
    const result: DebugEvent[] = [];

    // Add store events first
    for (const e of events) {
      const key = e.type === "server-log" && e.errorId
        ? `server-${e.errorId}`
        : e.id;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(e);
      }
    }

    // Add server logs that aren't already in store
    for (const log of serverLogs) {
      const key = log.errorId ? `server-${log.errorId}` : log.id;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(log);
      }
    }

    // Sort by timestamp
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [events, serverLogs]);

  // Filter events based on tab and filter
  const filteredEvents = React.useMemo(() => {
    let result = allEventsWithServer;

    if (tab === "all") {
      // Show everything
      return result;
    }

    if (tab === "events") {
      // Filter out render-related events and server logs
      result = result.filter(
        (e) => !["web-vital", "route-render", "render", "server-log"].includes(e.type)
      );
      if (filter !== "all") {
        result = result.filter((e) => e.type === filter);
      }
    } else if (tab === "render") {
      result = result.filter((e) =>
        ["web-vital", "route-render", "render"].includes(e.type)
      );
    } else if (tab === "server") {
      result = result.filter((e) => e.type === "server-log");
    }

    return result;
  }, [allEventsWithServer, filter, tab]);

  // Fetch server logs and add to local state (not store to avoid duplicates)
  const handleFetchServerLogs = React.useCallback(async () => {
    setFetchingServer(true);
    try {
      const logs = await fetchServerLogsFromAPI();
      setServerLogs(logs);
    } finally {
      setFetchingServer(false);
    }
  }, []);

  // Copy handler - fetches server logs first if on "all" tab, then copies
  const handleCopy = React.useCallback(async () => {
    setFetchingServer(true);
    try {
      // Always fetch server logs before copying
      const freshServerLogs = await fetchServerLogsFromAPI();

      // Merge and deduplicate
      const storeEvents = getAllEvents();
      const seen = new Set<string>();
      const allEvents: DebugEvent[] = [];

      for (const e of storeEvents) {
        const key = e.type === "server-log" && e.errorId
          ? `server-${e.errorId}`
          : e.id;
        if (!seen.has(key)) {
          seen.add(key);
          allEvents.push(e);
        }
      }

      for (const log of freshServerLogs) {
        const key = log.errorId ? `server-${log.errorId}` : log.id;
        if (!seen.has(key)) {
          seen.add(key);
          allEvents.push(log);
        }
      }

      // Sort by timestamp
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Build export object
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalEvents: allEvents.length,
        clientEvents: storeEvents.length,
        serverLogs: freshServerLogs.length,
        events: allEvents,
      };

      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setFetchingServer(false);
    }
  }, []);

  // Download handler - fetches server logs and downloads as JSON file
  const handleDownload = React.useCallback(async () => {
    setFetchingServer(true);
    try {
      // Always fetch server logs before downloading
      const freshServerLogs = await fetchServerLogsFromAPI();

      // Merge and deduplicate
      const storeEvents = getAllEvents();
      const seen = new Set<string>();
      const allEvents: DebugEvent[] = [];

      for (const e of storeEvents) {
        const key = e.type === "server-log" && e.errorId
          ? `server-${e.errorId}`
          : e.id;
        if (!seen.has(key)) {
          seen.add(key);
          allEvents.push(e);
        }
      }

      for (const log of freshServerLogs) {
        const key = log.errorId ? `server-${log.errorId}` : log.id;
        if (!seen.has(key)) {
          seen.add(key);
          allEvents.push(log);
        }
      }

      // Sort by timestamp
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Build export object
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalEvents: allEvents.length,
        clientEvents: storeEvents.length,
        serverLogs: freshServerLogs.length,
        events: allEvents,
      };

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `geekhub-debug-${timestamp}.json`;

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setFetchingServer(false);
    }
  }, []);

  // Clear handler
  const handleClear = React.useCallback(() => {
    clearEvents();
    setServerLogs([]);
  }, []);

  // Count by type for badge
  const counts = React.useMemo(() => {
    const c = { all: allEventsWithServer.length, events: 0, render: 0, server: 0 };
    for (const e of allEventsWithServer) {
      if (["web-vital", "route-render", "render"].includes(e.type)) {
        c.render++;
      } else if (e.type === "server-log") {
        c.server++;
      } else {
        c.events++;
      }
    }
    return c;
  }, [allEventsWithServer]);

  return (
    <>
      {/* Floating Debug Button - fixed size to avoid CLS, positioned above other FABs */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[9999] flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition-colors"
        aria-label={`Debug (${counts.all} events)`}
        title={`Debug (${counts.all} events)`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-200" />
        </span>
      </button>

      {/* Debug Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>Debug Recorder</SheetTitle>
            <SheetDescription>
              {counts.all} eventos capturados
            </SheetDescription>
          </SheetHeader>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 border-b border-white/10 pb-2">
            {(["all", "events", "render", "server", "inspect"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  tab === t
                    ? "bg-purple-600 text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t === "all" && `All (${counts.all})`}
                {t === "events" && `Events (${counts.events})`}
                {t === "render" && `Render (${counts.render})`}
                {t === "server" && `Server (${counts.server})`}
                {t === "inspect" && "Inspect"}
              </button>
            ))}
          </div>

          {/* Filters (only for events tab) */}
          {tab === "events" && (
            <div className="flex items-center gap-2 px-4 py-2">
              {EVENT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Server Logs Fetch Button */}
          {tab === "server" && (
            <div className="px-4 py-2">
              <button
                onClick={handleFetchServerLogs}
                disabled={fetchingServer}
                className="w-full rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500 transition-colors disabled:opacity-50"
              >
                {fetchingServer ? "Fetching..." : "Fetch Server Logs"}
              </button>
            </div>
          )}

          {/* Inspector View Selector */}
          {tab === "inspect" && (
            <div className="px-4 py-2 space-y-2">
              <div className="flex items-center gap-2">
                {(["rq", "auth", "storage"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setInspectView(view)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      inspectView === view
                        ? "bg-cyan-600 text-white"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {view === "rq" && "React Query"}
                    {view === "auth" && "Auth"}
                    {view === "storage" && "Storage"}
                  </button>
                ))}
                <button
                  onClick={async () => {
                    if (inspectView === "rq") {
                      const snapshot = getRQSnapshot(queryClient);
                      setInspectData(formatRQSnapshot(snapshot));
                    } else if (inspectView === "auth") {
                      const snapshot = await getAuthSnapshot();
                      setInspectData(formatAuthSnapshot(snapshot));
                    } else if (inspectView === "storage") {
                      const snapshot = getStorageSnapshot();
                      setInspectData(formatStorageSnapshot(snapshot));
                    }
                  }}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-500 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-black/30 rounded-lg p-3 max-h-[60vh] overflow-y-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                  {inspectData || "Loading..."}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 py-2">
            <button
              onClick={handleCopy}
              disabled={fetchingServer}
              className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {fetchingServer ? "..." : copied ? "✓ Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              disabled={fetchingServer}
              className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {fetchingServer ? "..." : "Download"}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Events List (hidden on inspect tab) */}
          {tab !== "inspect" && (
            <div className="flex-1 overflow-y-auto bg-black/20 rounded-lg mx-4 mb-4">
              {filteredEvents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {tab === "server"
                    ? "No server logs. Click 'Fetch Server Logs' to load."
                    : "No events yet"}
                </div>
              ) : (
                [...filteredEvents].reverse().map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

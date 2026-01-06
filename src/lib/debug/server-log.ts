/**
 * Server-side debug log buffer
 * Only active in development mode
 *
 * @example
 * ```ts
 * import { pushServerLog, getServerLogs } from "@/lib/debug/server-log";
 *
 * pushServerLog({ level: "error", message: "Something failed", errorId: "abc123" });
 * const logs = getServerLogs(100);
 * ```
 */

// =========================
// Types
// =========================

export interface ServerLogEntry {
  id: string;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  route?: string;
  errorId?: string;
  timestamp: number;
}

// =========================
// Ring Buffer Configuration
// =========================

const MAX_SERVER_LOGS = 500;
const LOG_BUFFER_KEY = "__GH_SERVER_LOGS__";

// =========================
// Sensitive Data Patterns
// =========================

const SENSITIVE_PATTERNS = [
  /Authorization:\s*Bearer\s+[A-Za-z0-9\-_\.]+/gi,
  /Bearer\s+[A-Za-z0-9\-_\.]+/gi,
  /cookie:\s*[^\n]+/gi,
  /set-cookie:\s*[^\n]+/gi,
  /password["\s:=]+[^\s,}"']+/gi,
  /secret["\s:=]+[^\s,}"']+/gi,
  /token["\s:=]+[^\s,}"']+/gi,
  /api[_-]?key["\s:=]+[^\s,}"']+/gi,
  /supabase[_-]?key["\s:=]+[^\s,}"']+/gi,
];

function sanitize(text: string): string {
  let result = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

// =========================
// Global Buffer Access
// =========================

declare global {
  var __GH_SERVER_LOGS__: ServerLogEntry[] | undefined;
}

function getBuffer(): ServerLogEntry[] {
  if (!globalThis[LOG_BUFFER_KEY]) {
    globalThis[LOG_BUFFER_KEY] = [];
  }
  return globalThis[LOG_BUFFER_KEY]!;
}

// =========================
// Generate Error ID
// =========================

export function generateErrorId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// =========================
// Push Log Entry
// =========================

interface PushLogOptions {
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  route?: string;
  errorId?: string;
}

export function pushServerLog(options: PushLogOptions): void {
  // Only in development
  if (process.env.NODE_ENV !== "development") return;

  const buffer = getBuffer();

  const entry: ServerLogEntry = {
    id: generateErrorId(),
    level: options.level,
    message: sanitize(options.message),
    stack: options.stack ? sanitize(options.stack) : undefined,
    route: options.route,
    errorId: options.errorId,
    timestamp: Date.now(),
  };

  buffer.push(entry);

  // Trim if over limit (ring buffer)
  if (buffer.length > MAX_SERVER_LOGS) {
    buffer.splice(0, buffer.length - MAX_SERVER_LOGS);
  }
}

// =========================
// Get Logs
// =========================

export function getServerLogs(limit = 100): ServerLogEntry[] {
  if (process.env.NODE_ENV !== "development") return [];

  const buffer = getBuffer();
  const clampedLimit = Math.min(Math.max(limit, 1), MAX_SERVER_LOGS);

  return buffer.slice(-clampedLimit);
}

// =========================
// Clear Logs
// =========================

export function clearServerLogs(): void {
  if (process.env.NODE_ENV !== "development") return;

  const buffer = getBuffer();
  buffer.length = 0;
}

// =========================
// Console Hook (dev only)
// =========================

let consoleHooked = false;
let originalConsoleError: typeof console.error | null = null;
let originalConsoleWarn: typeof console.warn | null = null;

export function hookServerConsole(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (consoleHooked) return;
  if (typeof window !== "undefined") return; // Client-side guard

  consoleHooked = true;
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;

  console.error = function (...args: unknown[]) {
    // Format message
    const message = args
      .map((arg) => {
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    // Extract stack from Error
    const errorArg = args.find((arg): arg is Error => arg instanceof Error);

    pushServerLog({
      level: "error",
      message,
      stack: errorArg?.stack,
    });

    // Call original
    originalConsoleError?.apply(console, args);
  };

  console.warn = function (...args: unknown[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    pushServerLog({
      level: "warn",
      message,
    });

    // Call original
    originalConsoleWarn?.apply(console, args);
  };
}

export function unhookServerConsole(): void {
  if (!consoleHooked) return;

  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
  }
  consoleHooked = false;
}

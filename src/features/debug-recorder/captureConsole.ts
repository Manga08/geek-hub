import { pushEvent } from "./store";
import type { ConsoleEvent } from "./types";

// =========================
// Original Console References
// =========================

let originalError: typeof console.error | null = null;
let originalWarn: typeof console.warn | null = null;
let originalLog: typeof console.log | null = null;
let originalInfo: typeof console.info | null = null;
let isInstalled = false;

// Configuration for what to capture
let captureLog = false;
let captureInfo = false;

// =========================
// Format Arguments to String
// =========================

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
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
}

// =========================
// Extract Stack Trace
// =========================

function extractStack(args: unknown[]): string | undefined {
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) {
      return arg.stack;
    }
  }
  return undefined;
}

// =========================
// Install Console Wrappers
// =========================

export interface ConsoleCaputeOptions {
  /** Capture console.log (default: false - can be noisy) */
  captureLog?: boolean;
  /** Capture console.info (default: false - can be noisy) */
  captureInfo?: boolean;
}

export function installConsoleCapture(options?: ConsoleCaputeOptions): void {
  if (typeof window === "undefined" || isInstalled) return;

  captureLog = options?.captureLog ?? false;
  captureInfo = options?.captureInfo ?? false;

  originalError = console.error;
  originalWarn = console.warn;
  originalLog = console.log;
  originalInfo = console.info;
  isInstalled = true;

  console.error = function capturedError(...args: unknown[]): void {
    pushEvent({
      type: "error",
      message: formatArgs(args),
      stack: extractStack(args),
    } satisfies Omit<ConsoleEvent, "id" | "timestamp">);

    // Call original
    originalError?.apply(console, args);
  };

  console.warn = function capturedWarn(...args: unknown[]): void {
    pushEvent({
      type: "warn",
      message: formatArgs(args),
      stack: extractStack(args),
    } satisfies Omit<ConsoleEvent, "id" | "timestamp">);

    // Call original
    originalWarn?.apply(console, args);
  };

  // Optional: capture console.log
  if (captureLog) {
    console.log = function capturedLog(...args: unknown[]): void {
      pushEvent({
        type: "log",
        message: formatArgs(args),
      } satisfies Omit<ConsoleEvent, "id" | "timestamp">);

      // Call original
      originalLog?.apply(console, args);
    };
  }

  // Optional: capture console.info
  if (captureInfo) {
    console.info = function capturedInfo(...args: unknown[]): void {
      pushEvent({
        type: "info",
        message: formatArgs(args),
      } satisfies Omit<ConsoleEvent, "id" | "timestamp">);

      // Call original
      originalInfo?.apply(console, args);
    };
  }
}

// =========================
// Uninstall Console Wrappers
// =========================

export function uninstallConsoleCapture(): void {
  if (typeof window === "undefined" || !isInstalled) return;

  if (originalError) {
    console.error = originalError;
    originalError = null;
  }

  if (originalWarn) {
    console.warn = originalWarn;
    originalWarn = null;
  }

  if (originalLog) {
    console.log = originalLog;
    originalLog = null;
  }

  if (originalInfo) {
    console.info = originalInfo;
    originalInfo = null;
  }

  isInstalled = false;
  captureLog = false;
  captureInfo = false;
}

import { pushEvent } from "./store";
import type { ConsoleEvent } from "./types";

// =========================
// Original Console References
// =========================

let originalError: typeof console.error | null = null;
let originalWarn: typeof console.warn | null = null;
let isInstalled = false;

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

export function installConsoleCapture(): void {
  if (typeof window === "undefined" || isInstalled) return;

  originalError = console.error;
  originalWarn = console.warn;
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

  isInstalled = false;
}

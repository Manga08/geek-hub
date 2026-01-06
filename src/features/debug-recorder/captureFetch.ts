import { pushEvent } from "./store";
import type { FetchEvent } from "./types";

// =========================
// Original Fetch Reference
// =========================

let originalFetch: typeof window.fetch | null = null;
let isInstalled = false;

// =========================
// Extract Error ID from Response
// =========================

async function extractErrorId(response: Response): Promise<string | undefined> {
  // Try header first
  const headerErrorId = response.headers.get("x-gh-error-id");
  if (headerErrorId) return headerErrorId;

  // Try to parse JSON body for errorId (only if not ok)
  if (!response.ok) {
    try {
      // Clone to avoid consuming the body
      const cloned = response.clone();
      const json = await cloned.json();
      if (json?.errorId) return json.errorId;
    } catch {
      // Not JSON or parsing failed
    }
  }

  return undefined;
}

// =========================
// Install Fetch Wrapper
// =========================

export function installFetchCapture(): void {
  if (typeof window === "undefined" || isInstalled) return;

  originalFetch = window.fetch;
  isInstalled = true;

  window.fetch = async function capturedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    // Only capture /api/* requests
    const isApiRequest = url.includes("/api/");

    if (!isApiRequest || !originalFetch) {
      return originalFetch!(input, init);
    }

    const method = init?.method ?? "GET";
    const startTime = performance.now();

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.round(performance.now() - startTime);

      // Extract errorId if response failed
      let errorId: string | undefined;
      if (!response.ok) {
        errorId = await extractErrorId(response);
      }

      pushEvent({
        type: "fetch",
        method,
        url,
        status: response.status,
        durationMs,
        ok: response.ok,
        errorId,
      } satisfies Omit<FetchEvent, "id" | "timestamp">);

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);

      pushEvent({
        type: "fetch",
        method,
        url,
        status: 0,
        durationMs,
        ok: false,
      } satisfies Omit<FetchEvent, "id" | "timestamp">);

      throw error;
    }
  };
}

// =========================
// Uninstall Fetch Wrapper
// =========================

export function uninstallFetchCapture(): void {
  if (typeof window === "undefined" || !isInstalled || !originalFetch) return;

  window.fetch = originalFetch;
  originalFetch = null;
  isInstalled = false;
}

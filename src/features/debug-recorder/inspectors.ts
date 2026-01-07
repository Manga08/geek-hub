// =========================
// Debug Inspectors
// =========================
// Utilities to snapshot React Query, Auth, and Storage state

import type { RQQueryState, AuthSnapshot, StorageSnapshot } from "./types";

// =========================
// React Query Inspector
// =========================

/**
 * Get a snapshot of all React Query cache entries
 * Requires access to the QueryClient instance
 */
export function getRQSnapshot(queryClient: unknown): RQQueryState[] {
  try {
    // @ts-expect-error - QueryClient is typed differently but we access internal cache
    const cache = queryClient?.getQueryCache?.();
    if (!cache) return [];

    const queries = cache.getAll?.() ?? [];

    return queries.map((query: unknown) => {
      // @ts-expect-error - accessing internal query structure
      const state = query.state;
      // @ts-expect-error - accessing queryKey
      const queryKey = query.queryKey;

      return {
        queryKey: JSON.stringify(queryKey),
        state: state.fetchStatus === "fetching"
          ? "fetching"
          : state.fetchStatus === "paused"
            ? "paused"
            : state.isInvalidated
              ? "stale"
              : state.dataUpdatedAt === 0
                ? "inactive"
                : "fresh",
        dataUpdatedAt: state.dataUpdatedAt || undefined,
        errorUpdatedAt: state.errorUpdatedAt || undefined,
        fetchStatus: state.fetchStatus ?? "idle",
        isStale: state.isInvalidated ?? false,
        isInvalidated: state.isInvalidated ?? false,
      } satisfies RQQueryState;
    });
  } catch {
    return [];
  }
}

/**
 * Format RQ snapshot for display
 */
export function formatRQSnapshot(queries: RQQueryState[]): string {
  if (queries.length === 0) return "No queries in cache";

  const lines: string[] = [`${queries.length} queries in cache\n`];

  // Group by status
  const fetching = queries.filter(q => q.state === "fetching");
  const stale = queries.filter(q => q.state === "stale");
  const fresh = queries.filter(q => q.state === "fresh");

  if (fetching.length > 0) {
    lines.push(`⏳ Fetching (${fetching.length}):`);
    fetching.forEach(q => lines.push(`  • ${q.queryKey}`));
  }

  if (stale.length > 0) {
    lines.push(`🔄 Stale (${stale.length}):`);
    stale.forEach(q => lines.push(`  • ${q.queryKey}`));
  }

  if (fresh.length > 0) {
    lines.push(`✅ Fresh (${fresh.length}):`);
    fresh.forEach(q => lines.push(`  • ${q.queryKey}`));
  }

  return lines.join("\n");
}

// =========================
// Auth Snapshot
// =========================

/**
 * Get current auth state from Supabase session and group context
 */
export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  if (typeof window === "undefined") {
    return {
      userId: null,
      email: null,
      groupId: null,
      groupName: null,
      role: null,
      expiresAt: null,
    };
  }

  try {
    // Try to get from localStorage (faster than API call)
    const sessionKey = Object.keys(localStorage).find(
      k => k.startsWith("sb-") && k.endsWith("-auth-token")
    );

    let userId: string | null = null;
    let email: string | null = null;
    let expiresAt: number | null = null;

    if (sessionKey) {
      const session = JSON.parse(localStorage.getItem(sessionKey) || "{}");
      userId = session?.user?.id ?? null;
      email = session?.user?.email ?? null;
      expiresAt = session?.expires_at ? session.expires_at * 1000 : null;
    }

    // Get group context from our app's localStorage
    const groupId = localStorage.getItem("GH_CURRENT_GROUP_ID") ?? null;
    const groupName = localStorage.getItem("GH_CURRENT_GROUP_NAME") ?? null;
    const role = localStorage.getItem("GH_CURRENT_GROUP_ROLE") ?? null;

    return { userId, email, groupId, groupName, role, expiresAt };
  } catch {
    return {
      userId: null,
      email: null,
      groupId: null,
      groupName: null,
      role: null,
      expiresAt: null,
    };
  }
}

/**
 * Format auth snapshot for display
 */
export function formatAuthSnapshot(auth: AuthSnapshot): string {
  const lines: string[] = ["=== Auth State ==="];

  if (!auth.userId) {
    lines.push("Not authenticated");
    return lines.join("\n");
  }

  lines.push(`User ID: ${auth.userId}`);
  lines.push(`Email: ${auth.email ?? "N/A"}`);

  if (auth.expiresAt) {
    const remaining = auth.expiresAt - Date.now();
    const minutes = Math.floor(remaining / 60000);
    const status = remaining > 0 ? `expires in ${minutes}m` : "EXPIRED";
    lines.push(`Session: ${status}`);
  }

  lines.push("");
  lines.push("=== Group Context ===");
  lines.push(`Group ID: ${auth.groupId ?? "None"}`);
  lines.push(`Group Name: ${auth.groupName ?? "N/A"}`);
  lines.push(`Role: ${auth.role ?? "N/A"}`);

  return lines.join("\n");
}

// =========================
// Storage Inspector
// =========================

/** Keys to highlight as important (excludes auth tokens for security) */
const IMPORTANT_KEYS = [
  "GH_",
  "theme",
  "sidebar",
];

/** Patterns that indicate sensitive data that should be redacted */
const SENSITIVE_PATTERNS = [
  /token/i,
  /refresh/i,
  /access/i,
  /jwt/i,
  /auth/i,
  /session/i,
  /supabase/i,
  /cookie/i,
  /secret/i,
  /password/i,
  /^sb-/i, // Supabase keys
];

/**
 * Sanitize storage value to redact sensitive data
 * @param key - The storage key
 * @param value - The raw value
 * @returns Sanitized value (redacted if sensitive, truncated otherwise)
 *
 * Examples of redacted keys:
 * - "sb-xxx-auth-token" -> "[REDACTED]"
 * - "supabase.auth.token" -> "[REDACTED]"
 * - "access_token" -> "[REDACTED]"
 * - "GH_CURRENT_GROUP_ID" -> actual value (safe)
 */
function sanitizeStorageValue(key: string, value: string): string {
  // Check if key matches any sensitive pattern
  const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));

  if (isSensitive) {
    return `[REDACTED] (length: ${value.length})`;
  }

  // For non-sensitive values, truncate if too long (max 500 chars)
  const MAX_LENGTH = 500;
  if (value.length > MAX_LENGTH) {
    return value.slice(0, MAX_LENGTH) + `... [truncated, total: ${value.length}]`;
  }

  return value;
}

/**
 * Get snapshot of localStorage and sessionStorage
 * Filters to show only app-relevant keys by default
 */
export function getStorageSnapshot(includeAll = false): StorageSnapshot {
  const result: StorageSnapshot = {
    localStorage: {},
    sessionStorage: {},
  };

  if (typeof window === "undefined") return result;

  // Helper to check if key is important
  const isImportant = (key: string) =>
    includeAll || IMPORTANT_KEYS.some(prefix => key.startsWith(prefix));

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isImportant(key)) {
        const value = localStorage.getItem(key) ?? "";
        // Sanitize: redact sensitive values, truncate long ones
        result.localStorage[key] = sanitizeStorageValue(key, value);
      }
    }
  } catch {
    // Storage access denied
  }

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isImportant(key)) {
        const value = sessionStorage.getItem(key) ?? "";
        // Sanitize: redact sensitive values, truncate long ones
        result.sessionStorage[key] = sanitizeStorageValue(key, value);
      }
    }
  } catch {
    // Storage access denied
  }

  return result;
}

/**
 * Format storage snapshot for display
 */
export function formatStorageSnapshot(storage: StorageSnapshot): string {
  const lines: string[] = [];

  const localKeys = Object.keys(storage.localStorage);
  const sessionKeys = Object.keys(storage.sessionStorage);

  lines.push(`=== localStorage (${localKeys.length} keys) ===`);
  if (localKeys.length === 0) {
    lines.push("  (empty)");
  } else {
    for (const key of localKeys.sort()) {
      const value = storage.localStorage[key];
      // Try to pretty-print JSON
      let display = value;
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          const parsed = JSON.parse(value);
          display = JSON.stringify(parsed, null, 2);
        } catch {
          // Keep original
        }
      }
      lines.push(`\n${key}:`);
      lines.push(`  ${display}`);
    }
  }

  lines.push("");
  lines.push(`=== sessionStorage (${sessionKeys.length} keys) ===`);
  if (sessionKeys.length === 0) {
    lines.push("  (empty)");
  } else {
    for (const key of sessionKeys.sort()) {
      const value = storage.sessionStorage[key];
      lines.push(`\n${key}:`);
      lines.push(`  ${value}`);
    }
  }

  return lines.join("\n");
}

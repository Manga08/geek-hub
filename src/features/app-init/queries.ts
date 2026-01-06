import { readApiJson } from "@/lib/api-client";
import type { AppInitResponse } from "./types";

// =========================
// Query Keys
// =========================

export const appInitKeys = {
  root: ["app-init"] as const,
} as const;

// =========================
// Fetch Function
// =========================

export async function fetchAppInit(limit = 8): Promise<AppInitResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`/api/init?${params}`);
  return readApiJson<AppInitResponse>(response);
}

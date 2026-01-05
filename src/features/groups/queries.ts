import type { GroupRow, CurrentGroupResponse } from "./types";

export const groupKeys = {
  all: ["groups"] as const,
  current: () => [...groupKeys.all, "current"] as const,
  list: () => [...groupKeys.all, "list"] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
};

export async function fetchCurrentGroup(): Promise<CurrentGroupResponse | null> {
  const res = await fetch("/api/groups/current");

  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error("Error fetching current group");
  }

  return res.json();
}

export async function fetchGroupsList(): Promise<GroupRow[]> {
  const res = await fetch("/api/groups/list");

  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Error fetching groups list");
  }

  return res.json();
}

export async function setCurrentGroup(
  groupId: string
): Promise<CurrentGroupResponse> {
  const res = await fetch("/api/groups/current", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Error setting current group");
  }

  return res.json();
}

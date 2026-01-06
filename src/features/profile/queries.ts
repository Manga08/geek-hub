import { readApiJson } from "@/lib/api-client";
import type { UserProfile, UpdateProfileDTO } from "./types";

// =========================
// Query Keys
// =========================

export const profileKeys = {
  all: ["profile"] as const,
  current: () => [...profileKeys.all, "current"] as const,
} as const;

// =========================
// Fetch Functions
// =========================

export async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch("/api/profile");
  return readApiJson<UserProfile>(response);
}

export async function updateProfile(dto: UpdateProfileDTO): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readApiJson<UserProfile>(response);
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
  });
  return readApiJson<UserProfile>(response);
}

export async function deleteAvatar(): Promise<UserProfile> {
  const response = await fetch("/api/profile/avatar", {
    method: "DELETE",
  });
  return readApiJson<UserProfile>(response);
}

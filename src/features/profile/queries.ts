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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al cargar perfil");
  }

  return response.json();
}

export async function updateProfile(dto: UpdateProfileDTO): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al actualizar perfil");
  }

  return response.json();
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al subir avatar");
  }

  return response.json();
}

export async function deleteAvatar(): Promise<UserProfile> {
  const response = await fetch("/api/profile/avatar", {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Error al eliminar avatar");
  }

  return response.json();
}

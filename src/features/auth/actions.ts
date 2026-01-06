"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileAndDefaultGroup } from "@/features/groups/service";
import { validatePassword } from "./validation";

type ActionState = {
  error?: string;
  success?: boolean;
};

function resolveNextPath(nextRaw: FormDataEntryValue | null | undefined): string {
  const sanitized = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null);
  if (!sanitized || sanitized === "/") {
    return "/search";
  }
  return sanitized;
}

async function getOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const nextPath = resolveNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email y password son requeridos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  await ensureProfileAndDefaultGroup(supabase);

  redirect(nextPath);
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const nextPath = resolveNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email y password son requeridos" };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// =========================
// Password Recovery Actions
// =========================

export async function requestPasswordResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "El email es requerido" };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    // No revelar si el email existe o no por seguridad
    console.error("Password reset error:", error.message);
  }

  // Siempre mostrar éxito para evitar enumeración de emails
  return { success: true };
}

export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  const validationError = validatePassword(password, confirmPassword);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createSupabaseServerClient();
  
  // Verificar que hay sesión activa
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Por favor, solicita un nuevo enlace de recuperación." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  // Cerrar sesión para que el usuario inicie con la nueva contraseña
  await supabase.auth.signOut();

  redirect("/login?reset=ok");
}

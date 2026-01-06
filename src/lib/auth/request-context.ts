import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unauthenticated, badRequest } from "@/lib/api/respond";

/**
 * Unified authentication context for API routes.
 * Reduces Supabase roundtrips by fetching session + default_group_id in ONE query.
 */

export type ApiContext = {
  supabase: SupabaseClient;
  userId: string;
  defaultGroupId: string;
};

export type AuthResult =
  | { ok: true; ctx: ApiContext }
  | { ok: false; response: Response };

/**
 * Get authenticated API context with userId and defaultGroupId.
 * Single roundtrip: getSession() + profiles query.
 *
 * Usage:
 * ```ts
 * const result = await requireApiContext();
 * if (!result.ok) return result.response;
 * const { supabase, userId, defaultGroupId } = result.ctx;
 * ```
 */
export async function requireApiContext(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  // getSession() is faster than getUser() - no extra auth server call
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      ok: false,
      response: unauthenticated("Authentication required"),
    };
  }

  const userId = session.user.id;

  // Fetch profile with default_group_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.default_group_id) {
    return {
      ok: false,
      response: badRequest("No group context. Please select a group first."),
    };
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId,
      defaultGroupId: profile.default_group_id,
    },
  };
}

/**
 * Lightweight auth check - only userId, no group lookup.
 * Use when defaultGroupId is not needed.
 */
export type LightAuthResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; response: Response };

export async function requireSessionUserId(): Promise<LightAuthResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return {
      ok: false,
      response: unauthenticated("Authentication required"),
    };
  }

  return {
    ok: true,
    supabase,
    userId: session.user.id,
  };
}

/**
 * Get only the defaultGroupId (requires auth).
 * Use when you have supabase + userId already but need group.
 */
export async function requireDefaultGroupId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true; groupId: string } | { ok: false; response: Response }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("default_group_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.default_group_id) {
    return {
      ok: false,
      response: badRequest("No group context. Please select a group first."),
    };
  }

  return {
    ok: true,
    groupId: profile.default_group_id,
  };
}

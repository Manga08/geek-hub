import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ok,
  badRequest,
  unauthenticated,
  internal,
  updateProfileBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

// =========================
// GET /api/profile - Get current user's profile
// =========================
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, default_group_id, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (error) {
      // Profile might not exist yet
      if (error.code === "PGRST116") {
        return ok({
          id: user.id,
          display_name: null,
          avatar_url: null,
          email: user.email,
        });
      }
      throw error;
    }

    return ok({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return internal();
  }
}

// =========================
// PATCH /api/profile - Update display_name
// =========================
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const body = await request.json();
    const parsed = validateBody(updateProfileBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const { display_name } = parsed.data;

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: display_name?.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("id, display_name, avatar_url, default_group_id")
      .single();

    if (error) {
      throw error;
    }

    return ok({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return internal();
  }
}

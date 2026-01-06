import { NextRequest } from "next/server";
import { requireSessionUserId } from "@/lib/auth/request-context";
import {
  ok,
  badRequest,
  internal,
  updateProfileBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

// =========================
// GET /api/profile - Get current user's profile
// =========================
export async function GET() {
  // Single auth call via getSession()
  const result = await requireSessionUserId();
  if (!result.ok) return result.response;

  const { supabase, userId } = result;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, default_group_id, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error) {
      // Profile might not exist yet
      if (error.code === "PGRST116") {
        const { data: { user } } = await supabase.auth.getUser();
        return ok({
          id: userId,
          display_name: null,
          avatar_url: null,
          email: user?.email,
        });
      }
      throw error;
    }

    // Get email from session user
    const { data: { user } } = await supabase.auth.getUser();

    return ok({
      ...profile,
      email: user?.email,
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
  // Single auth call via getSession()
  const result = await requireSessionUserId();
  if (!result.ok) return result.response;

  const { supabase, userId } = result;

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
        id: userId,
        display_name: display_name?.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("id, display_name, avatar_url, default_group_id")
      .single();

    if (error) {
      throw error;
    }

    // Get email from session user
    const { data: { user } } = await supabase.auth.getUser();

    return ok({
      ...profile,
      email: user?.email,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return internal();
  }
}

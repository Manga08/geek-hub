import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ok, fail, unauthenticated, internal } from "@/lib/api/respond";
import {
  bulkActionBodySchema,
  validateBody,
  formatZodErrors,
} from "@/lib/api/schemas";

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated("Authentication required");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = validateBody(bulkActionBodySchema, body);
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Invalid request body", 400, formatZodErrors(parsed.error));
  }

  const { ids, action, value } = parsed.data;

  try {
    let success = 0;
    let failed = 0;

    if (action === "set_status" && typeof value === "string") {
      // Bulk update status - only user's own entries
      const { data, error } = await supabase
        .from("library_entries")
        .update({ status: value, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("id", ids)
        .select("id");

      if (error) throw error;
      success = data?.length ?? 0;
      failed = ids.length - success;
    } else if (action === "set_favorite" && typeof value === "boolean") {
      // Bulk update favorite - only user's own entries
      const { data, error } = await supabase
        .from("library_entries")
        .update({ is_favorite: value, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("id", ids)
        .select("id");

      if (error) throw error;
      success = data?.length ?? 0;
      failed = ids.length - success;
    } else if (action === "delete") {
      // Bulk delete - only user's own entries
      const { data, error } = await supabase
        .from("library_entries")
        .delete()
        .eq("user_id", user.id)
        .in("id", ids)
        .select("id");

      if (error) throw error;
      success = data?.length ?? 0;
      failed = ids.length - success;
    } else {
      return fail("BAD_REQUEST", "Invalid action or missing value", 400);
    }

    return ok({ success, failed });
  } catch (error) {
    console.error("PATCH /api/library/entry/bulk error:", error);
    return internal("Failed to perform bulk action");
  }
}

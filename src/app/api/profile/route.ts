import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// =========================
// GET /api/profile - Get current user's profile
// =========================
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        return NextResponse.json({
          id: user.id,
          display_name: null,
          avatar_url: null,
          email: user.email,
        });
      }
      throw error;
    }

    return NextResponse.json({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =========================
// PATCH /api/profile - Update display_name
// =========================
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { display_name } = body as { display_name?: string };

    // Validate display_name
    if (display_name !== undefined) {
      if (typeof display_name !== "string") {
        return NextResponse.json(
          { error: "display_name must be a string" },
          { status: 400 }
        );
      }
      if (display_name.length > 100) {
        return NextResponse.json(
          { error: "display_name must be 100 characters or less" },
          { status: 400 }
        );
      }
    }

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

    return NextResponse.json({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

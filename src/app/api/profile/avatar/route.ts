import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force Node.js runtime for file uploads
export const runtime = "nodejs";

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Helper: include details only in dev
function errorResponse(
  error: string,
  status: number,
  details?: unknown
) {
  const body: { error: string; details?: unknown } = { error };
  if (process.env.NODE_ENV === "development" && details) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

// =========================
// POST /api/profile/avatar - Upload avatar
// =========================
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${user.id}/avatar.${ext}`;

    // Delete old avatar if exists (best-effort, don't fail on error)
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (listError) {
      console.warn("Avatar list warning (non-fatal):", listError);
    }

    if (existingFiles?.length) {
      const filesToDelete = existingFiles
        .filter((f: { name: string }) => f.name.startsWith("avatar."))
        .map((f: { name: string }) => `${user.id}/${f.name}`);

      if (filesToDelete.length > 0) {
        const { error: removeError } = await supabase.storage.from("avatars").remove(filesToDelete);
        if (removeError) {
          console.warn("Avatar remove warning (non-fatal):", removeError);
        }
      }
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return errorResponse("Failed to upload avatar", 500, {
        code: uploadError.message,
        name: uploadError.name,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache bust

    // Update-first strategy: check if profile exists, then update or insert
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .single();

    let profile;
    if (existingProfile) {
      // Profile exists: just update avatar_url
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, display_name, avatar_url, default_group_id")
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      // Profile doesn't exist: insert with display_name fallback
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Usuario";

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .select("id, display_name, avatar_url, default_group_id")
        .single();

      if (insertError) throw insertError;
      profile = data;
    }

    return NextResponse.json({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);
    const err = error as { message?: string; code?: string };
    return errorResponse("Internal server error", 500, {
      message: err.message,
      code: err.code,
    });
  }
}

// =========================
// DELETE /api/profile/avatar - Remove avatar
// =========================
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // List and delete all avatar files for user (best-effort)
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (listError) {
      console.warn("Avatar list warning (non-fatal):", listError);
    }

    if (existingFiles?.length) {
      const filesToDelete = existingFiles.map((f: { name: string }) => `${user.id}/${f.name}`);
      const { error: removeError } = await supabase.storage.from("avatars").remove(filesToDelete);
      if (removeError) {
        console.warn("Avatar remove warning (non-fatal):", removeError);
      }
    }

    // Update profile to remove avatar URL (update-first strategy)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .single();

    let profile;
    if (existingProfile) {
      // Profile exists: just update avatar_url to null
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, display_name, avatar_url, default_group_id")
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      // Profile doesn't exist: insert with display_name fallback (no avatar)
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Usuario";

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .select("id, display_name, avatar_url, default_group_id")
        .single();

      if (insertError) throw insertError;
      profile = data;
    }

    return NextResponse.json({
      ...profile,
      email: user.email,
    });
  } catch (error) {
    console.error("DELETE /api/profile/avatar error:", error);
    const err = error as { message?: string; code?: string };
    return errorResponse("Internal server error", 500, {
      message: err.message,
      code: err.code,
    });
  }
}

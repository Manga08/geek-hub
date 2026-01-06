import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";
import { logActivityEvent } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { message: "Missing required field: id" },
        { status: 400 }
      );
    }

    const entry = await libraryRepo.toggleFavorite(id);

    // Log activity event
    await logActivityEvent({
      groupId: entry.group_id,
      actorId: user.id,
      eventType: entry.is_favorite ? "library_entry_favorited" : "library_entry_unfavorited",
      entityType: "library_entry",
      entityId: entry.id,
      metadata: {
        item_title: entry.title,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("POST /api/library/entry/favorite error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

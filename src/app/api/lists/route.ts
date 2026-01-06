import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as listsRepo from "@/features/lists/repo";
import type { CreateListDTO } from "@/features/lists/types";
import { logActivityEvent } from "@/lib/activity-log";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const lists = await listsRepo.listLists();
    return NextResponse.json({ lists });
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateListDTO = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const list = await listsRepo.createList(body);

    // Log activity event
    await logActivityEvent({
      groupId: list.group_id,
      actorId: user.id,
      eventType: "list_created",
      entityType: "list",
      entityId: list.id,
      metadata: { name: list.name, list_name: list.name },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

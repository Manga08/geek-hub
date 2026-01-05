import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";
import type { CreateEntryDTO, UpdateEntryDTO } from "@/features/library/types";
import { logActivityEvent, getCurrentGroupId } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const provider = searchParams.get("provider");
  const externalId = searchParams.get("externalId");

  if (!type || !provider || !externalId) {
    return NextResponse.json(
      { message: "Missing required params: type, provider, externalId" },
      { status: 400 }
    );
  }

  try {
    const entry = await libraryRepo.findByItem(type, provider, externalId);

    if (!entry) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("GET /api/library/entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateEntryDTO = await request.json();

    if (!body.type || !body.provider || !body.external_id) {
      return NextResponse.json(
        { message: "Missing required fields: type, provider, external_id" },
        { status: 400 }
      );
    }

    // Check if entry already exists in the current group
    const existing = await libraryRepo.findByItem(
      body.type,
      body.provider,
      body.external_id,
      body.group_id // Pass group_id if provided
    );

    if (existing) {
      return NextResponse.json(
        { message: "Entry already exists", entry: existing },
        { status: 409 }
      );
    }

    // Create entry (group_id will be resolved from user's default if not provided)
    const entry = await libraryRepo.create(body);

    // Log activity event
    await logActivityEvent({
      groupId: entry.group_id,
      actorId: user.id,
      eventType: "library_entry_added",
      entityType: "library_entry",
      entityId: entry.id,
      metadata: {
        item_title: entry.title ?? body.external_id,
        item_type: body.type,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/library/entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...dto }: { id: string } & UpdateEntryDTO = body;

    if (!id) {
      return NextResponse.json(
        { message: "Missing required field: id" },
        { status: 400 }
      );
    }

    const entry = await libraryRepo.update(id, dto);

    // Log activity event if status changed
    if (dto.status) {
      await logActivityEvent({
        groupId: entry.group_id,
        actorId: user.id,
        eventType: "library_entry_updated",
        entityType: "library_entry",
        entityId: entry.id,
        metadata: {
          item_title: entry.title ?? undefined,
          new_status: dto.status,
        },
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/library/entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get entry first for logging
    const groupId = await getCurrentGroupId();
    
    await libraryRepo.delete(id);

    // Log activity event
    if (groupId) {
      await logActivityEvent({
        groupId,
        actorId: user.id,
        eventType: "library_entry_deleted",
        entityType: "library_entry",
        entityId: id,
        metadata: {},
      });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/library/entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

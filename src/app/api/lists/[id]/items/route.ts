import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as listsRepo from "@/features/lists/repo";
import type { AddListItemDTO, UpdateListItemDTO } from "@/features/lists/types";
import { logActivityEvent } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listsRepo.listItems(id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/lists/[id]/items error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: AddListItemDTO = await request.json();

    if (!body.item_type || !body.provider || !body.external_id) {
      return NextResponse.json(
        { message: "Missing required fields: item_type, provider, external_id" },
        { status: 400 }
      );
    }

    // Get list for logging
    const list = await listsRepo.getList(id);
    if (!list) {
      return NextResponse.json({ message: "List not found" }, { status: 404 });
    }

    const item = await listsRepo.addListItem(id, body);

    // Log activity event
    await logActivityEvent({
      groupId: list.group_id,
      actorId: user.id,
      eventType: "list_item_added",
      entityType: "list_item",
      entityId: `${id}:${body.external_id}`,
      metadata: {
        list_id: id,
        list_name: list.name,
        item_title: body.title ?? body.external_id,
        item_type: body.item_type,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists/[id]/items error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    // Check for duplicate key error
    if (message.includes("duplicate")) {
      return NextResponse.json(
        { message: "Item already exists in list" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: { item_type: string; provider: string; external_id: string } & UpdateListItemDTO = await request.json();

    if (!body.item_type || !body.provider || !body.external_id) {
      return NextResponse.json(
        { message: "Missing required fields: item_type, provider, external_id" },
        { status: 400 }
      );
    }

    const { item_type, provider, external_id, ...dto } = body;
    const item = await listsRepo.updateListItem(id, item_type, provider, external_id, dto);
    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH /api/lists/[id]/items error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: { item_type: string; provider: string; external_id: string } = await request.json();

    if (!body.item_type || !body.provider || !body.external_id) {
      return NextResponse.json(
        { message: "Missing required fields: item_type, provider, external_id" },
        { status: 400 }
      );
    }

    // Get list for logging
    const list = await listsRepo.getList(id);
    if (!list) {
      return NextResponse.json({ message: "List not found" }, { status: 404 });
    }

    await listsRepo.removeListItem(id, body.item_type, body.provider, body.external_id);

    // Log activity event
    await logActivityEvent({
      groupId: list.group_id,
      actorId: user.id,
      eventType: "list_item_removed",
      entityType: "list_item",
      entityId: id,
      metadata: {
        list_id: id,
        list_name: list.name,
        item_title: body.external_id,
        item_type: body.item_type,
      },
    });

    return NextResponse.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /api/lists/[id]/items error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

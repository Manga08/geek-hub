import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as listsRepo from "@/features/lists/repo";
import type { AddListItemDTO, UpdateListItemDTO } from "@/features/lists/types";

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

    const item = await listsRepo.addListItem(id, body);
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

    await listsRepo.removeListItem(id, body.item_type, body.provider, body.external_id);
    return NextResponse.json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /api/lists/[id]/items error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

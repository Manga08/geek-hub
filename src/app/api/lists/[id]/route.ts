import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as listsRepo from "@/features/lists/repo";
import type { UpdateListDTO } from "@/features/lists/types";

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
    const list = await listsRepo.getList(id);

    if (!list) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const items = await listsRepo.listItems(id);
    return NextResponse.json({ list, items });
  } catch (error) {
    console.error("GET /api/lists/[id] error:", error);
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
    const body: UpdateListDTO = await request.json();
    const list = await listsRepo.updateList(id, body);
    return NextResponse.json(list);
  } catch (error) {
    console.error("PATCH /api/lists/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await listsRepo.deleteList(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/lists/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

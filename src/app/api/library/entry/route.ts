import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";
import type { CreateEntryDTO, UpdateEntryDTO } from "@/features/library/types";

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

    // Check if entry already exists
    const existing = await libraryRepo.findByItem(
      body.type,
      body.provider,
      body.external_id
    );

    if (existing) {
      return NextResponse.json(
        { message: "Entry already exists", entry: existing },
        { status: 409 }
      );
    }

    const entry = await libraryRepo.create(body);
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

    await libraryRepo.delete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/library/entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";

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
    return NextResponse.json(entry);
  } catch (error) {
    console.error("POST /api/library/entry/favorite error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

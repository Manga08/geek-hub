import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const favorite = searchParams.get("favorite");
  const sort = searchParams.get("sort") as "recent" | "rating" | undefined;

  try {
    const entries = await libraryRepo.listByUser({
      type,
      status,
      isFavorite: favorite === "true" ? true : favorite === "false" ? false : undefined,
      sort: sort || "recent",
      limit: 100,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/library/list error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

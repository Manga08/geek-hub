import { NextRequest, NextResponse } from "next/server";

import { searchUnified } from "@/features/catalog/service";
import type { UnifiedItemType } from "@/features/catalog/normalize/unified.types";

const ALLOWED_TYPES: UnifiedItemType[] = ["game", "movie", "tv", "anime"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as UnifiedItemType | null;
  const query = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page") ?? "1";
  const page = Number.parseInt(pageParam, 10);

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid or missing type" }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  try {
    const result = await searchUnified({ type, query, page: safePage });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal error" }, { status: 500 });
  }
}

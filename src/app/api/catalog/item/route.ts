import { NextRequest, NextResponse } from "next/server";

import { getUnifiedItem } from "@/features/catalog/service";
import type { Provider, UnifiedItemType } from "@/features/catalog/normalize/unified.types";

const ALLOWED_TYPES: UnifiedItemType[] = ["game", "movie", "tv", "anime"];
const ALLOWED_PROVIDERS: Provider[] = ["rawg", "tmdb"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as UnifiedItemType | null;
  const provider = searchParams.get("provider") as Provider | null;
  const externalId = searchParams.get("externalId");

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid or missing type" }, { status: 400 });
  }
  if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid or missing provider" }, { status: 400 });
  }
  if (!externalId) {
    return NextResponse.json({ error: "Missing externalId" }, { status: 400 });
  }

  try {
    const item = await getUnifiedItem({ type, provider, externalId });
    return NextResponse.json(item);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

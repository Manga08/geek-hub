import { notFound } from "next/navigation";

import { ItemPageClient } from "@/features/catalog/components/ItemPageClient";
import type { Provider, UnifiedItemType } from "@/features/catalog/normalize/unified.types";

function parseParams(typeParam: string, keyParam: string): { type: UnifiedItemType; provider: Provider; externalId: string } {
  if (typeParam !== "game" && typeParam !== "movie" && typeParam !== "tv" && typeParam !== "anime") {
    throw new Error("Invalid type");
  }
  const [provider, ...rest] = keyParam.split("-");
  const externalId = rest.join("-");
  if (provider !== "rawg" && provider !== "tmdb") {
    throw new Error("Invalid provider");
  }
  if (!externalId) {
    throw new Error("Invalid key");
  }
  return { type: typeParam, provider, externalId };
}

export default async function ItemPage({ params }: { params: Promise<{ type: string; key: string }> }) {
  const resolvedParams = await params;
  let parsed: { type: UnifiedItemType; provider: Provider; externalId: string };
  try {
    parsed = parseParams(resolvedParams.type, resolvedParams.key);
  } catch {
    notFound();
  }

  return <ItemPageClient type={parsed.type} keyParam={`${parsed.provider}-${parsed.externalId}`} />;
}

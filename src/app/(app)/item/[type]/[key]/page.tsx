import { notFound } from "next/navigation";

import { ItemDetail } from "@/features/catalog/components/ItemDetail";
import type { Provider, UnifiedItemType } from "@/features/catalog/normalize/unified.types";
import { getUnifiedItem } from "@/features/catalog/service";

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

export default async function ItemPage({ params }: { params: { type: string; key: string } }) {
  let parsed: { type: UnifiedItemType; provider: Provider; externalId: string };
  try {
    parsed = parseParams(params.type, params.key);
  } catch {
    notFound();
  }

  let item;
  try {
    item = await getUnifiedItem({ type: parsed.type, provider: parsed.provider, externalId: parsed.externalId });
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ItemDetail item={item} />
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { UnifiedCatalogItem } from "@/features/catalog/normalize/unified.types";

function typeLabel(type: UnifiedCatalogItem["type"]): string {
  return type;
}

export function MediaCard({ item }: { item: UnifiedCatalogItem }) {
  const href = `/item/${item.type}/${item.key}`;

  return (
    <Link href={href} className="block h-full">
      <Card className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[2/3] w-full bg-zinc-100">
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              sizes="200px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin imagen</div>
          )}
        </div>
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="capitalize">
              {typeLabel(item.type)}
            </Badge>
            {item.year ? <span className="text-xs text-zinc-500">{item.year}</span> : null}
          </div>
          <p className="line-clamp-2 text-sm font-medium text-zinc-900">{item.title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

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
      <Card className="h-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-md transition hover:-translate-y-[1px] hover:shadow-[0_25px_70px_-60px_rgba(139,92,246,0.55)]">
        <div className="relative aspect-[2/3] w-full bg-gradient-to-b from-white/5 to-black/40">
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
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin imagen</div>
          )}
        </div>
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="capitalize">
              {typeLabel(item.type)}
            </Badge>
            {item.year ? <span className="text-xs text-muted-foreground/80">{item.year}</span> : null}
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

import SearchClient from "@/features/catalog/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">GeekHub · Catálogo unificado</p>
        <h1 className="text-3xl font-semibold text-foreground">Explora juegos, películas, series y anime</h1>
        <p className="text-sm text-muted-foreground">Búsquedas rápidas con resultados en vivo y tarjetas glass.</p>
      </div>
      <SearchClient />
    </div>
  );
}

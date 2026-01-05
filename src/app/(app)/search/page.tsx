import SearchClient from "@/features/catalog/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Catálogo</h1>
        <p className="text-sm text-zinc-600">Busca juegos, películas, series o anime.</p>
      </div>
      <SearchClient />
    </div>
  );
}

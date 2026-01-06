export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}

import { MediaGridSkeleton } from "@/components/shared/Skeletons";

export default function LoadingSearchPage() {
  return (
    <div className="space-y-6">
      <MediaGridSkeleton count={12} />
    </div>
  );
}

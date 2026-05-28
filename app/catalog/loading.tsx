import { PosterGridSkeleton } from "@/components/kage/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-[1600px] py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
      <Skeleton className="mb-6 h-12 w-48" />
      <div className="mb-6 space-y-3">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      <PosterGridSkeleton count={24} />
    </div>
  );
}

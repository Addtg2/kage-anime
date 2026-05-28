import { HeroSkeleton, PosterGridSkeleton } from "@/components/kage/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnimeLoading() {
  return (
    <div className="bg-background">
      <HeroSkeleton />
      <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] border-b border-border py-[clamp(1.5rem,3vw,2.75rem)] px-[clamp(1rem,4vw,3.5rem)] md:grid-cols-[2fr_1fr]">
        <div>
          <Skeleton className="mb-4 h-7 w-2/3" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="px-[clamp(1rem,4vw,3.5rem)] py-[clamp(1.5rem,2.5vw,2rem)]">
        <PosterGridSkeleton count={8} />
      </div>
    </div>
  );
}

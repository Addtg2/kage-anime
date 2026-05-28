import { Skeleton } from "@/components/ui/skeleton";

export default function WatchLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-[1400px] py-[clamp(1rem,3vw,2rem)] px-[clamp(1rem,4vw,2.5rem)]">
        <div className="mb-5 flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="mb-4 flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
            <Skeleton className="aspect-video w-full rounded-xl" />
          </div>
          <Skeleton className="h-[480px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

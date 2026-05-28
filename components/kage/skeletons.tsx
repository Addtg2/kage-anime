import { Skeleton } from "@/components/ui/skeleton";

const POSTER_W = "w-[clamp(132px,15vw,200px)]";

/** Скелет ряда постеров (карусель). Совпадает по геометрии с AnimeRail. */
export function RailSkeleton({ title }: { title?: string }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,2.5rem)] sm:mb-4">
        <div className="flex flex-col gap-2">
          {title ? (
            <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
              {title}
            </h2>
          ) : (
            <Skeleton className="h-6 w-40" />
          )}
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="overflow-hidden px-[clamp(1rem,4vw,2.5rem)]">
        <div className="flex gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${POSTER_W} shrink-0`}>
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Скелет hero-секции главной / страницы тайтла. */
export function HeroSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <section
      className={`relative overflow-hidden ${
        tall
          ? "h-[clamp(440px,52vw,660px)]"
          : "h-[clamp(400px,46vw,600px)]"
      }`}
    >
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-x-0 bottom-[clamp(3rem,7vw,6rem)] px-[clamp(1rem,4vw,2.5rem)]">
        <Skeleton className="mb-4 h-3 w-32" />
        <Skeleton className="mb-3 h-3 w-40" />
        <Skeleton className="mb-4 h-12 w-3/4 max-w-lg" />
        <Skeleton className="mb-6 h-3 w-2/3 max-w-md" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </section>
  );
}

/** Скелет грида постеров (каталог / mylist). */
export function PosterGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div
      className="grid gap-3 sm:gap-4"
      style={{
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(50% - 0.375rem, 170px), 1fr))",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-2.5 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

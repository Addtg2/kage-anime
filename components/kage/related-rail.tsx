import Link from "next/link";
import Image from "next/image";

import type { ShikiRelated } from "@/lib/shikimori/types";

/**
 * Связанные тайтлы (приквел/сиквел/спин-офф). Берёт relationRu из Shikimori
 * как бэдж. Скрывается, если нет ни одного с anime != null.
 */
export function RelatedRail({ related }: { related: ShikiRelated[] }) {
  const items = related.filter((r) => r.anime !== null);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,3.5rem)] sm:mb-4">
        <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
          Связанные тайтлы
        </h2>
      </div>
      <div className="no-scrollbar overflow-x-auto px-[clamp(1rem,4vw,3.5rem)]">
        <div className="flex gap-3 sm:gap-4">
          {items.map((r, i) => {
            const a = r.anime!;
            const titleRu = a.russian ?? a.name;
            const year = a.airedOn?.year;
            const poster = a.poster?.mainUrl;
            return (
              <Link
                key={`${a.id}-${i}`}
                href={`/anime/${a.id}`}
                className="group w-[clamp(132px,15vw,200px)] shrink-0 transition-transform hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-surface">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={titleRu}
                      fill
                      sizes="(max-width: 640px) 35vw, 200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  {r.relationRu && (
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                      {r.relationRu}
                    </div>
                  )}
                </div>
                <div className="mt-2 line-clamp-2 font-display text-[13px] leading-tight text-foreground">
                  {titleRu}
                </div>
                {year && (
                  <div className="mt-0.5 text-[11px] text-text-dim">{year}</div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

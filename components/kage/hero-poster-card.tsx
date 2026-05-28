import Image from "next/image";

import type { Anime } from "@/lib/anime/types";

/**
 * Крупная резкая карточка реального постера в hero. Висит по центру-у справа,
 * с halo по палитре. На мобильных скрыта — на узких экранах вся работа идёт
 * через размытый бэкдроп под текстом (он рендерится отдельно в hero).
 */
export function HeroPosterCard({ anime }: { anime: Anime }) {
  if (!anime.posterUrl) return null;
  const [c1, , c3] = anime.palette;

  return (
    <div className="pointer-events-none absolute top-1/2 z-10 hidden -translate-y-1/2 md:block right-[clamp(0.75rem,2.5vw,4rem)]">
      <div
        className="absolute inset-0 -z-10 opacity-60 blur-[90px]"
        style={{
          background: `radial-gradient(circle at 50% 55%, ${c3}, ${c1}99 35%, transparent 75%)`,
        }}
      />
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/80 w-[clamp(180px,20vw,360px)]"
        style={{
          transform: "rotate(2deg)",
          viewTransitionName: `poster-${anime.id}`,
        }}
      >
        <Image
          src={anime.posterUrl}
          alt=""
          fill
          sizes="(min-width:1536px) 360px, (min-width:1024px) 280px, 200px"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 65%, ${c1}aa 100%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/12" />
      </div>
    </div>
  );
}

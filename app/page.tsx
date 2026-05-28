import Link from "next/link";
import { Play, Plus } from "lucide-react";

import { fetchAnimes, currentSeason, type AnimesParams } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { AnimeRail } from "@/components/kage/rail";
import { ContinueRail } from "@/components/kage/continue-rail";
import { TrendingLeaderboard } from "@/components/kage/trending-leaderboard";
import { Rating } from "@/components/kage/rating";
import { FadeIn } from "@/components/kage/fade-in";
import { HeroBackdrop } from "@/components/kage/hero-backdrop";
import { HeroPosterCard } from "@/components/kage/hero-poster-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: пересобираем главную раз в 5 минут.
export const revalidate = 300;

async function loadSection(
  params: AnimesParams,
  revalidate: number,
): Promise<Anime[]> {
  try {
    const list = await fetchAnimes(params, revalidate);
    return list.map(mapShikiToAnime);
  } catch {
    // одна упавшая секция не должна валить всю главную
    return [];
  }
}

export default async function Home() {
  const [trending, seasonNew, topRanked, upcoming] = await Promise.all([
    loadSection({ order: "popularity", status: "ongoing", kind: "tv", limit: 16 }, 300),
    loadSection({ order: "aired_on", season: currentSeason(), limit: 16 }, 300),
    loadSection({ order: "ranked", kind: "tv", limit: 16 }, 1800),
    loadSection({ order: "popularity", status: "anons", limit: 16 }, 1800),
  ]);

  const hero = trending[0] ?? topRanked[0] ?? seasonNew[0];

  return (
    <div className="bg-background">
      {hero && <Hero anime={hero} />}

      <div className="flex flex-col gap-9 pb-4 pt-6 sm:gap-12 lg:gap-14">
        <ContinueRail />
        <TrendingLeaderboard items={trending.slice(0, 10)} />
        <AnimeRail title="Новинки сезона" subtitle="Свежие тайтлы" items={seasonNew} />
        <AnimeRail title="Топ всех времён" subtitle="Высший рейтинг" items={topRanked} />
        <AnimeRail title="Скоро на экранах" subtitle="Анонсы" items={upcoming} />
      </div>
    </div>
  );
}

function Hero({ anime }: { anime: Anime }) {
  return (
    <section className="relative overflow-hidden h-[clamp(440px,52vw,660px)]">
      <HeroBackdrop anime={anime} />

      <HeroPosterCard anime={anime} />

      <FadeIn className="absolute inset-x-0 px-[clamp(1rem,4vw,2.5rem)] bottom-[clamp(3rem,7vw,6rem)]">
        <div className="max-w-2xl text-white">
          <div className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand sm:text-xs">
            <span className="h-px w-6 bg-brand" />
            №1 на этой неделе
          </div>

          {anime.titleJp && (
            <div className="mb-2.5 font-jp text-sm tracking-[0.1em] text-text-dim sm:text-base">
              {anime.titleJp}
            </div>
          )}

          <h1 className="font-display mb-4 leading-[0.95] text-[clamp(2.2rem,5.5vw,4.75rem)]">
            {anime.titleRu}
          </h1>

          <p className="mb-5 line-clamp-2 max-w-xl text-sm leading-relaxed text-foreground/85 sm:text-base">
            {anime.tagline}
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-text-dim">
            {anime.rating > 0 && (
              <>
                <Rating value={anime.rating} />
                <Dot />
              </>
            )}
            {anime.year > 0 && (
              <>
                <span>{anime.year}</span>
                <Dot />
              </>
            )}
            {anime.eps > 0 && (
              <>
                <span>{anime.eps} эп.</span>
                <Dot />
              </>
            )}
            {anime.age && <span>{anime.age}</span>}
            {anime.genres.length > 0 && (
              <span className="hidden items-center gap-3 sm:flex">
                <Dot />
                <span>{anime.genres.slice(0, 3).join(" · ")}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/anime/${anime.id}/watch`}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              <Play fill="currentColor" strokeWidth={0} />
              Смотреть
            </Link>
            <Link
              href={`/anime/${anime.id}`}
              className={cn(buttonVariants({ variant: "glass", size: "lg" }))}
            >
              <Plus />
              Подробнее
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-text-dim" />;
}

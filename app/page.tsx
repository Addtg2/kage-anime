import { fetchAnimes, currentSeason, type AnimesParams } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { AnimeRail } from "@/components/kage/rail";
import { ContinueRail } from "@/components/kage/continue-rail";
import { TrendingLeaderboard } from "@/components/kage/trending-leaderboard";
import { HeroCarousel } from "@/components/kage/hero-carousel";

// ISR: пересобираем главную раз в 10 минут.
export const revalidate = 600;

async function loadSection(
  params: AnimesParams,
  revalidate: number,
): Promise<Anime[] | null> {
  try {
    const list = await fetchAnimes(params, revalidate);
    return list.map(mapShikiToAnime);
  } catch {
    return null;
  }
}

// Shikimori genre ids: Action=1, Comedy=4, Romance=22, Mystery=7
const GENRE_RAILS = [
  { genre: "1", title: "Топ боевиков", subtitle: "Экшн" },
  { genre: "4", title: "Топ комедий", subtitle: "Комедия" },
  { genre: "22", title: "Топ романтики", subtitle: "Романтика" },
  { genre: "7", title: "Топ детективов", subtitle: "Детектив" },
] as const;

export default async function Home() {
  const [trending, seasonNew, topRanked, upcoming, ...genreRails] = await Promise.all([
    loadSection({ order: "popularity", status: "ongoing", kind: "tv", limit: 16 }, 300),
    loadSection({ order: "aired_on", season: currentSeason(), limit: 16 }, 300),
    loadSection({ order: "ranked", kind: "tv", limit: 16 }, 1800),
    loadSection({ order: "popularity", status: "anons", limit: 16 }, 1800),
    ...GENRE_RAILS.map((r) =>
      loadSection({ genre: r.genre, order: "popularity", limit: 16 }, 3600),
    ),
  ]);

  const heroItems = (trending ?? topRanked ?? seasonNew ?? []).slice(0, 3);

  return (
    <div className="bg-background">
      <HeroCarousel items={heroItems} />

      <div className="flex flex-col gap-9 pb-4 pt-6 sm:gap-12 lg:gap-14">
        <ContinueRail />
        {trending && <TrendingLeaderboard items={trending.slice(0, 10)} />}
        {seasonNew && <AnimeRail title="Новинки сезона" subtitle="Свежие тайтлы" items={seasonNew} />}
        {topRanked && <AnimeRail title="Топ всех времён" subtitle="Высший рейтинг" items={topRanked} />}
        {upcoming && <AnimeRail title="Скоро на экранах" subtitle="Анонсы" items={upcoming} />}
        {GENRE_RAILS.map((r, i) =>
          genreRails[i] ? (
            <AnimeRail
              key={r.genre}
              title={r.title}
              subtitle={r.subtitle}
              items={genreRails[i]!}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}


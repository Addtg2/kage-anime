import {
  fetchAnimes,
  fetchAnimeExtras,
  currentSeason,
  type AnimesParams,
} from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { AnimeRail } from "@/components/kage/rail";
import { ContinueRail } from "@/components/kage/continue-rail";
import { TrendingLeaderboard } from "@/components/kage/trending-leaderboard";
import { HeroCarousel } from "@/components/kage/hero-carousel";
import { Reveal } from "@/components/kage/reveal";

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
  const season = currentSeason();
  const [ongoing, popularNew, allTime, newEpisodes, ...genreRails] =
    await Promise.all([
      loadSection({ order: "popularity", status: "ongoing", kind: "tv", limit: 16 }, 300),
      loadSection({ order: "popularity", season, limit: 16 }, 300),
      loadSection({ order: "popularity", kind: "tv", limit: 16 }, 1800),
      loadSection({ order: "aired_on", status: "ongoing", limit: 16 }, 300),
      ...GENRE_RAILS.map((r) =>
        loadSection({ genre: r.genre, order: "popularity", limit: 16 }, 3600),
      ),
    ]);

  const heroItems = (ongoing ?? allTime ?? popularNew ?? []).slice(0, 3);

  // Трейлеры только для hero-слайдов (3 запроса, кешируются ISR) — фоновое видео.
  const heroTrailers: Record<string, string> = {};
  await Promise.all(
    heroItems.map(async (a) => {
      try {
        const extras = await fetchAnimeExtras(a.id, 1800);
        const pv = extras.videos.find(
          (v) =>
            /youtu/i.test(v.url) &&
            (v.kind === "pv" || v.kind === "op" || v.kind === "ed"),
        );
        if (pv?.url) heroTrailers[a.id] = pv.url;
      } catch {
        /* трейлер не критичен — остаётся постер-фон */
      }
    }),
  );

  return (
    <div className="bg-background">
      <HeroCarousel items={heroItems} trailers={heroTrailers} />

      <div className="flex flex-col gap-9 pb-8 pt-6 sm:gap-12 lg:gap-14">
        <ContinueRail />

        {ongoing && (
          <Reveal>
            <AnimeRail
              title="Онгоинги"
              subtitle="Сейчас выходят"
              items={ongoing}
              href="/catalog?status=ongoing"
            />
          </Reveal>
        )}

        {popularNew && (
          <Reveal>
            <AnimeRail
              title="Популярные новинки"
              subtitle="Этот сезон"
              items={popularNew}
              href={`/catalog?season=${season}`}
            />
          </Reveal>
        )}

        {newEpisodes && (
          <Reveal>
            <AnimeRail
              title="Новые серии"
              subtitle="Свежие эпизоды"
              items={newEpisodes}
              href="/catalog?status=ongoing&order=aired_on"
            />
          </Reveal>
        )}

        {/* Топ-100 — фирменный акцентный блок (не обычный рейл) */}
        {allTime && allTime.length >= 4 && (
          <Reveal>
            <TrendingLeaderboard
              items={allTime.slice(0, 10)}
              eyebrow="Топ 100"
              title="Популярное за всё время"
            />
          </Reveal>
        )}

        {GENRE_RAILS.map((r, i) =>
          genreRails[i] ? (
            <Reveal key={r.genre}>
              <AnimeRail
                title={r.title}
                subtitle={r.subtitle}
                items={genreRails[i]!}
                href={`/catalog?genre=${r.genre}`}
              />
            </Reveal>
          ) : null,
        )}
      </div>
    </div>
  );
}

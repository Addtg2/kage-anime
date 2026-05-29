import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  fetchAnimeById,
  fetchAnimeExtras,
  fetchAnimes,
  fetchFranchise,
  fetchSimilar,
  type AnimeExtras,
} from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { BackButton } from "@/components/kage/back-button";
import { Comments } from "@/components/kage/comments";
import { DetailTabs } from "@/components/kage/detail-tabs";
import { FadeIn } from "@/components/kage/fade-in";
import {
  FranchiseRail,
  type FranchiseEntry,
} from "@/components/kage/franchise-rail";
import { HeroActions } from "@/components/kage/hero-actions";
import { HeroBackdrop } from "@/components/kage/hero-backdrop";
import { HeroPosterCard } from "@/components/kage/hero-poster-card";
import { Rating } from "@/components/kage/rating";
import { RelatedRail } from "@/components/kage/related-rail";
import { ScreenshotsRail } from "@/components/kage/screenshots-rail";
import { ShareBar } from "@/components/kage/share-bar";
import { SpoilerSynopsis } from "@/components/kage/spoiler-synopsis";
import { UserRating } from "@/components/kage/user-rating";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

// Дедупликация: generateMetadata и страница используют один и тот же запрос за рендер.
const getAnime = cache((id: string) => fetchAnimeById(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shiki = await getAnime(id).catch(() => null);
  if (!shiki) return { title: "Тайтл не найден" };
  const a = mapShikiToAnime(shiki);
  const description = a.synopsis || `${a.titleRu} — смотреть на ${SITE_NAME}`;
  const ogImage = `${SITE_URL}/api/og?id=${encodeURIComponent(a.id)}`;
  const images = [{ url: ogImage, width: 1200, height: 630, alt: a.titleRu }];
  return {
    title: a.titleRu,
    description,
    alternates: { canonical: `/anime/${a.id}` },
    openGraph: {
      type: "video.tv_show",
      title: a.titleRu,
      description,
      url: `${SITE_URL}/anime/${a.id}`,
      siteName: SITE_NAME,
      images,
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: a.titleRu,
      description,
      images: [ogImage],
    },
  };
}

export default async function AnimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shiki = await getAnime(id).catch(() => null);
  if (!shiki) notFound();

  const anime = mapShikiToAnime(shiki);

  // Похожее + экстры (видео/скриншоты/связанные) + франшиза — параллельно.
  const sourceGenreIds = new Set((shiki.genres ?? []).map((g) => g.id));
  const genreId = shiki.genres?.[0]?.id;
  const sourceYear = shiki.airedOn?.year ?? 0;

  const [similar, extras, franchiseRaw] = await Promise.all([
    (async (): Promise<Anime[]> => {
      // 1) Кураторское "похожее" из Shikimori REST. Для свежих тайтлов часто пусто.
      const curated = await fetchSimilar(id, 3600);
      if (curated.length > 0) {
        return curated
          .map(mapShikiToAnime)
          .filter((a) => a.id !== anime.id)
          .slice(0, 10);
      }
      // 2) Фолбэк: топ-50 по первому жанру + локальный ререйтинг по
      //    пересечению жанров с исходным и близости года. Без этого
      //    для любого "сёнэна" выпадал один и тот же набор AoT/Naruto/JJK.
      if (!genreId) return [];
      try {
        const list = await fetchAnimes(
          { genre: genreId, order: "popularity", limit: 50 },
          1800,
        );
        const scored = list
          .filter((a) => a.id !== shiki.id)
          .map((a) => {
            const overlap = (a.genres ?? []).reduce(
              (n, g) => n + (sourceGenreIds.has(g.id) ? 1 : 0),
              0,
            );
            const yearDiff =
              sourceYear && a.airedOn?.year
                ? Math.abs(a.airedOn.year - sourceYear)
                : 30;
            // overlap важнее года; формула: больше общих жанров = выше,
            // ближе по году = выше, при равенстве — выше score.
            return {
              a,
              score: overlap * 100 - yearDiff + (a.score ?? 0) / 10,
            };
          });
        scored.sort((x, y) => y.score - x.score);
        return scored.slice(0, 10).map(({ a }) => mapShikiToAnime(a));
      } catch {
        return [];
      }
    })(),
    fetchAnimeExtras(id, 1800) satisfies Promise<AnimeExtras>,
    shiki.franchise ? fetchFranchise(shiki.franchise, 3600) : Promise.resolve([]),
  ]);

  // Группа сортируется Shikimori по aired_on; добиваем сортировку по date на случай ничьих/null.
  const franchise: FranchiseEntry[] = franchiseRaw
    .map((f) => ({
      id: f.id,
      titleRu: f.russian || f.name,
      kind: f.kind,
      year: f.airedOn?.year ?? null,
      episodes: f.episodes,
      status: f.status,
      posterUrl: f.poster?.mainUrl ?? null,
      airedDate: f.airedOn?.date ?? null,
    }))
    .sort((a, b) => {
      const ad = a.airedDate ? Date.parse(a.airedDate) : a.year ? a.year * 1e10 : Infinity;
      const bd = b.airedDate ? Date.parse(b.airedDate) : b.year ? b.year * 1e10 : Infinity;
      return ad - bd;
    });

  const epCount = Math.min(anime.eps || 0, 24);
  const episodes = Array.from({ length: epCount }, (_, i) => ({
    num: i + 1,
    title: `Серия ${i + 1}`,
    duration: shiki.duration ?? 24,
  }));

  const canWatch = shiki.status !== "anons";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: anime.titleRu,
    alternateName: anime.titleJp || undefined,
    description: anime.synopsis || undefined,
    image: anime.posterUrl,
    inLanguage: "ja",
    numberOfEpisodes: anime.eps || undefined,
    datePublished: anime.year ? String(anime.year) : undefined,
    genre: anime.genres,
    aggregateRating:
      anime.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: anime.rating,
            bestRating: 10,
            ratingCount: 1000,
          }
        : undefined,
    contentRating: anime.age || undefined,
    productionCompany: anime.studio ? { "@type": "Organization", name: anime.studio } : undefined,
    url: `${SITE_URL}/anime/${anime.id}`,
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden h-[clamp(400px,46vw,600px)]">
        <HeroBackdrop anime={anime} />

        <BackButton className="absolute left-[clamp(1rem,3vw,3.5rem)] top-[clamp(1rem,2.5vw,1.5rem)] z-20" />

        <HeroPosterCard
          anime={anime}
          trailerUrl={
            extras.videos.find(
              (v) =>
                v.kind === "pv" && /youtu/i.test(v.url),
            )?.url
          }
        />

        <FadeIn className="absolute inset-x-0 px-[clamp(1rem,4vw,3.5rem)] bottom-[clamp(1.5rem,4vw,3rem)] text-white">
          {anime.titleJp && (
            <div className="mb-2.5 font-jp text-sm tracking-[0.1em] text-text-dim sm:text-base">
              {anime.titleJp}
            </div>
          )}
          <h1 className="font-display mb-4 max-w-4xl leading-[0.95] text-[clamp(2rem,4.5vw,4rem)]">
            {anime.titleRu}
          </h1>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-text-dim">
            {anime.rating > 0 && (
              <>
                <Rating value={anime.rating} />
                <Dot />
              </>
            )}
            {anime.year > 0 && (
              <>
                <span className="text-white">{anime.year}</span>
                <Dot />
              </>
            )}
            {anime.eps > 0 && <span>{anime.eps} эпизодов</span>}
            {anime.age && (
              <span className="rounded border border-white/40 px-2 py-0.5 font-semibold text-white">
                {anime.age}
              </span>
            )}
          </div>

          <HeroActions
            anime={anime}
            canWatch={canWatch}
            videos={extras.videos}
          />

          <div className="mt-3">
            <ShareBar anime={anime} malId={shiki.malId} />
          </div>
        </FadeIn>
      </section>

      {/* SYNOPSIS + META */}
      <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] border-b border-border py-[clamp(1.5rem,3vw,2.75rem)] px-[clamp(1rem,4vw,3.5rem)] md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display mb-4 leading-snug text-brand text-[clamp(1.35rem,2.5vw,2rem)]">
            «{anime.tagline}»
          </p>
          {anime.synopsis && (
            <SpoilerSynopsis synopsis={anime.synopsis} />
          )}
          {shiki.genres && shiki.genres.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {shiki.genres
                .filter((g) => g.russian)
                .map((g) => (
                  <Link
                    key={g.id}
                    href={`/catalog?tag=${g.id}`}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-text-dim transition-colors hover:border-brand hover:text-brand"
                  >
                    #{g.russian}
                  </Link>
                ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
            <Meta label="Студия" value={anime.studio || "—"} />
            <Meta label="Жанр" value={anime.genres.join(", ") || "—"} />
            <Meta label="Год" value={anime.year ? String(anime.year) : "—"} />
            <Meta label="Возраст" value={anime.age || "—"} />
            <Meta label="Озвучка" value="RU · JP" />
          </dl>
          <UserRating animeId={anime.id} shikiRating={anime.rating > 0 ? anime.rating : undefined} />
        </div>
      </div>

      {/* EXTRAS: скриншоты + связанные (между метой и табами) */}
      {(extras.screenshots.length > 0 || extras.related.length > 0) && (
        <div className="flex flex-col gap-[clamp(1.5rem,3vw,2.5rem)] border-b border-border py-[clamp(1.5rem,3vw,2.5rem)]">
          {extras.screenshots.length > 0 && (
            <ScreenshotsRail screenshots={extras.screenshots.slice(0, 12)} />
          )}
          {extras.related.length > 0 && (
            <RelatedRail related={extras.related} />
          )}
        </div>
      )}

      {/* FRANCHISE — порядок просмотра, скрыт если в франшизе 0-1 тайтлов */}
      <FranchiseRail items={franchise} currentId={anime.id} />

      {/* TABS */}
      <DetailTabs
        anime={anime}
        episodes={episodes}
        similar={similar}
        screenshots={extras.screenshots}
        episodesAired={
          // Shikimori для завершённых тайтлов часто отдаёт episodesAired=0 —
          // нормализуем: released → все серии вышли, anons → ни одной.
          shiki.status === "released"
            ? episodes.length
            : shiki.status === "anons"
              ? 0
              : (shiki.episodesAired ?? 0)
        }
        nextEpisodeAt={shiki.nextEpisodeAt ?? null}
      />

      {/* COMMENTS */}
      <Comments animeId={anime.id} />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-dim">{label}</dt>
      <dd className="m-0 text-foreground">{value}</dd>
    </>
  );
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-text-dim" />;
}

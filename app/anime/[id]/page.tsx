import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  fetchAnimeById,
  fetchAnimeExtras,
  fetchAnimes,
  type AnimeExtras,
} from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { BackButton } from "@/components/kage/back-button";
import { DetailTabs } from "@/components/kage/detail-tabs";
import { FadeIn } from "@/components/kage/fade-in";
import { HeroActions } from "@/components/kage/hero-actions";
import { HeroBackdrop } from "@/components/kage/hero-backdrop";
import { HeroPosterCard } from "@/components/kage/hero-poster-card";
import { Rating } from "@/components/kage/rating";
import { RelatedRail } from "@/components/kage/related-rail";
import { ScreenshotsRail } from "@/components/kage/screenshots-rail";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 1800;

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
  const images = a.posterUrl ? [{ url: a.posterUrl, alt: a.titleRu }] : [];
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
      images: a.posterUrl ? [a.posterUrl] : undefined,
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

  // Похожее + экстры (видео/скриншоты/связанные) — параллельно.
  const genreId = shiki.genres?.[0]?.id;
  const [similar, extras] = await Promise.all([
    (async (): Promise<Anime[]> => {
      if (!genreId) return [];
      try {
        const list = await fetchAnimes(
          { genre: genreId, order: "popularity", limit: 12 },
          1800,
        );
        return list
          .map(mapShikiToAnime)
          .filter((a) => a.id !== anime.id)
          .slice(0, 10);
      } catch {
        return [];
      }
    })(),
    fetchAnimeExtras(id, 1800) satisfies Promise<AnimeExtras>,
  ]);

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

        <HeroPosterCard anime={anime} />

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
        </FadeIn>
      </section>

      {/* SYNOPSIS + META */}
      <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] border-b border-border py-[clamp(1.5rem,3vw,2.75rem)] px-[clamp(1rem,4vw,3.5rem)] md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display mb-4 leading-snug text-brand text-[clamp(1.35rem,2.5vw,2rem)]">
            «{anime.tagline}»
          </p>
          {anime.synopsis && (
            <p className="max-w-3xl text-sm leading-relaxed text-text-dim sm:text-base">
              {anime.synopsis}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
          <Meta label="Студия" value={anime.studio || "—"} />
          <Meta label="Жанр" value={anime.genres.join(", ") || "—"} />
          <Meta label="Год" value={anime.year ? String(anime.year) : "—"} />
          <Meta label="Возраст" value={anime.age || "—"} />
          <Meta label="Озвучка" value="RU · JP" />
        </dl>
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

      {/* TABS */}
      <DetailTabs anime={anime} episodes={episodes} similar={similar} />
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

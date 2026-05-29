import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchAnimeById } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import { kodikSearch } from "@/lib/kodik/client";
import { allohaSearch } from "@/lib/alloha/client";
import { BackButton } from "@/components/kage/back-button";
import { type PlayerTab } from "@/components/kage/player-switcher";
import { WatchSurface } from "@/components/kage/watch-surface";

// Источники могут зависеть от токенов/доступности — не кешируем страницу жёстко.
export const revalidate = 1800;

const getAnime = cache((id: string) => fetchAnimeById(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shiki = await getAnime(id).catch(() => null);
  if (!shiki) return { title: "Просмотр" };
  return { title: `Смотреть ${mapShikiToAnime(shiki).titleRu}` };
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string; start?: string }>;
}) {
  const { id } = await params;
  const { ep, start } = await searchParams;
  const startSeconds = start ? Math.max(0, Math.floor(Number(start))) : 0;
  const shiki = await getAnime(id).catch(() => null);
  if (!shiki) notFound();

  const anime = mapShikiToAnime(shiki);

  const epNum = ep ? Number(ep) : 1;

  // Оба провайдера параллельно, на сервере (токены не утекают в браузер).
  const [kodik, alloha] = await Promise.all([
    kodikSearch(id),
    allohaSearch(id),
  ]);

  const tabs: PlayerTab[] = [
    {
      id: "kodik",
      label: "Kodik",
      available: kodik.available,
      src: kodik.src,
      translations: kodik.translations,
    },
    {
      id: "alloha",
      label: "Alloha",
      available: alloha.available,
      src: alloha.src,
    },
  ];

  // Список серий — берём episodesAired (или episodes, если сериал завершён),
  // ограничиваем 60 для адекватного UI. Минимум 1, чтобы пикер не был пустым.
  const totalEps = Math.max(
    Math.min(shiki.episodesAired || shiki.episodes || 1, 60),
    1,
  );
  const episodes = Array.from({ length: totalEps }, (_, i) => i + 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-[1600px] py-[clamp(1rem,3vw,2rem)] px-[clamp(1rem,4vw,2.5rem)]">
        <div className="mb-5 flex items-center gap-4">
          <BackButton href={`/anime/${id}`} />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.2em] text-text-dim">
              {`Эпизод ${epNum}`}
              {shiki.kind ? ` · ${shiki.kind.toUpperCase()}` : ""}
            </div>
            <h1 className="font-display line-clamp-2 leading-tight text-[clamp(1.2rem,2.2vw,1.75rem)]">
              {anime.titleRu}
            </h1>
          </div>
        </div>

        <WatchSurface
          anime={anime}
          tabs={tabs}
          totalEps={totalEps}
          episodes={episodes}
          initialEpisode={epNum}
          initialStartSeconds={Number.isFinite(startSeconds) ? startSeconds : 0}
          episodeDuration={shiki.duration ?? null}
        />
      </div>
    </div>
  );
}

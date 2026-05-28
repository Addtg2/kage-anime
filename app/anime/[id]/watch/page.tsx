import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchAnimeById } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import { kodikSearch } from "@/lib/kodik/client";
import { allohaSearch } from "@/lib/alloha/client";
import { BackButton } from "@/components/kage/back-button";
import { EpisodePicker } from "@/components/kage/episode-picker";
import { PlayerSwitcher, type PlayerTab } from "@/components/kage/player-switcher";
import { WatchProgressWriter } from "@/components/kage/watch-progress-writer";

// Источники могут зависеть от токенов/доступности — не кешируем страницу жёстко.
export const revalidate = 600;

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
  searchParams: Promise<{ ep?: string }>;
}) {
  const { id } = await params;
  const { ep } = await searchParams;
  const shiki = await getAnime(id).catch(() => null);
  if (!shiki) notFound();

  const anime = mapShikiToAnime(shiki);

  // Оба провайдера параллельно, на сервере (токены не утекают в браузер).
  const [kodik, alloha] = await Promise.all([
    kodikSearch(id),
    allohaSearch(id),
  ]);

  const tabs: PlayerTab[] = [
    { id: "kodik", label: "Kodik", available: kodik.available, src: kodik.src },
    { id: "alloha", label: "Alloha", available: alloha.available, src: alloha.src },
  ];

  const epNum = ep ? Number(ep) : 1;

  // Список серий — берём episodesAired (или episodes, если сериал завершён),
  // ограничиваем 60 для адекватного UI. Минимум 1, чтобы пикер не был пустым.
  const totalEps = Math.max(
    Math.min(shiki.episodesAired || shiki.episodes || 1, 60),
    1,
  );
  const episodes = Array.from({ length: totalEps }, (_, i) => i + 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-[1400px] py-[clamp(1rem,3vw,2rem)] px-[clamp(1rem,4vw,2.5rem)]">
        <div className="mb-5 flex items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.2em] text-text-dim">
              {`Эпизод ${epNum}`}
              {shiki.kind ? ` · ${shiki.kind.toUpperCase()}` : ""}
            </div>
            <h1 className="font-display truncate leading-tight text-[clamp(1.2rem,2.2vw,1.75rem)]">
              {anime.titleRu}
            </h1>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <PlayerSwitcher tabs={tabs} />
            <WatchProgressWriter anime={anime} episode={epNum} />
            <p className="mt-4 text-xs text-text-mute">
              Видео предоставляется внешними плеерами Kodik и Alloha. KAGE не
              хранит и не раздаёт контент.
            </p>
          </div>
          <EpisodePicker
            animeId={anime.id}
            episodes={episodes}
            current={epNum}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Anime } from "@/lib/anime/types";
import { PlayerSwitcher, type PlayerTab } from "@/components/kage/player-switcher";
import { WatchProgressWriter } from "@/components/kage/watch-progress-writer";

interface WatchSurfaceProps {
  anime: Anime;
  tabs: PlayerTab[];
  totalEps: number;
  episodes: number[];
  initialEpisode: number;
  initialStartSeconds: number;
  episodeDuration: number | null;
}

/**
 * Клиентская оболочка страницы просмотра. iframe Kodik монтируется один раз
 * на источник + KAGE-озвучку; смена серий — встроенным UI Kodik внутри iframe.
 * Любая попытка «перевыбрать» серию снаружи провоцировала бы ремаунт iframe и
 * сбрасывала бы внутренний выбор озвучки. Поэтому здесь нет пикера серий,
 * кнопок next/prev и горячих клавиш переключения серий — стартовая серия
 * приходит только через `?ep=` (deep-link с детальной страницы / resume).
 */
export function WatchSurface({
  anime,
  tabs,
  totalEps: _totalEps,
  episodes: _episodes,
  initialEpisode,
  initialStartSeconds,
  episodeDuration,
}: WatchSurfaceProps) {
  return (
    <div className="mx-auto min-w-0 max-w-[1200px]">
      <PlayerSwitcher
        animeId={anime.id}
        tabs={tabs}
        initialEpisode={initialEpisode}
        episodeDuration={episodeDuration}
        startSeconds={initialStartSeconds}
      />
      <WatchProgressWriter anime={anime} episode={initialEpisode} />
      <p className="mt-4 text-xs text-text-mute">
        Видео предоставляется внешними плеерами Kodik и Alloha. KAGE не хранит
        и не раздаёт контент. Переключение серий — во внутреннем UI плеера.
      </p>
    </div>
  );
}

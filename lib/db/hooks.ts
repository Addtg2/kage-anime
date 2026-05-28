"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db, type HistoryRow } from "./dexie";

/** Последние N просмотренных тайтлов (desc по updatedAt). Для рейла «Продолжить смотреть». */
export function useResume(limit = 12): HistoryRow[] | undefined {
  return useLiveQuery(
    async () => {
      const d = db();
      if (!d) return [];
      return d.history.orderBy("updatedAt").reverse().limit(limit).toArray();
    },
    [limit],
  );
}

/** Последняя просмотренная серия тайтла. Для отметок «watched» в списке эпизодов. */
export function useLastSeen(animeId: string | undefined): HistoryRow | undefined {
  return useLiveQuery(
    async () => {
      const d = db();
      if (!d || !animeId) return undefined;
      return d.history.get(animeId);
    },
    [animeId],
  );
}

/** Процент просмотра (0–100) для прогресс-бара на постере. */
export function useWatchProgress(animeId: string, totalEps: number): number {
  return (
    useLiveQuery(
      async () => {
        const d = db();
        if (!d || !totalEps) return 0;
        const record = await d.history.get(animeId);
        if (!record) return 0;
        const watchedCount = record.watchedEpisodes?.length ?? record.episode;
        return Math.min((watchedCount / totalEps) * 100, 100);
      },
      [animeId, totalEps],
      0,
    ) ?? 0
  );
}

/** Список номеров просмотренных серий для отметок в списке эпизодов. */
export function useWatchedEpisodes(animeId: string | undefined): number[] {
  return (
    useLiveQuery(
      async () => {
        const d = db();
        if (!d || !animeId) return [];
        const record = await d.history.get(animeId);
        return record?.watchedEpisodes ?? [];
      },
      [animeId],
      [],
    ) ?? []
  );
}

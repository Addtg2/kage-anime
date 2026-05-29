"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db, type HistoryRow } from "./dexie";

/** Последние N просмотренных тайтлов (desc по updatedAt). Для рейла «Продолжить смотреть». */
export function useResume(limit = 12): HistoryRow[] | undefined {
  return useLiveQuery(
    async () => {
      try {
        const d = db();
        if (!d) return [];
        return await d.history.orderBy("updatedAt").reverse().limit(limit).toArray();
      } catch {
        return [];
      }
    },
    [limit],
  );
}

/** Последняя просмотренная серия тайтла. Для отметок «watched» в списке эпизодов. */
export function useLastSeen(animeId: string | undefined): HistoryRow | undefined {
  return useLiveQuery(
    async () => {
      try {
        const d = db();
        if (!d || !animeId) return undefined;
        return await d.history.get(animeId);
      } catch {
        return undefined;
      }
    },
    [animeId],
  );
}

/** Процент просмотра (0–100) для прогресс-бара на постере. */
export function useWatchProgress(animeId: string, totalEps: number): number {
  return (
    useLiveQuery(
      async () => {
        try {
          const d = db();
          if (!d || !totalEps) return 0;
          const record = await d.history.get(animeId);
          if (!record) return 0;
          const watchedCount = record.watchedEpisodes?.length ?? record.episode;
          return Math.min((watchedCount / totalEps) * 100, 100);
        } catch {
          return 0;
        }
      },
      [animeId, totalEps],
      0,
    ) ?? 0
  );
}

/**
 * Сводная статистика по истории просмотра (G3).
 * `hoursWatched` — приближение: каждая просмотренная серия = 24 мин.
 * `monthly` — bar chart за последние 6 месяцев: { label, count }.
 */
export interface ProfileStats {
  totalAnime: number;
  totalEpisodes: number;
  hoursWatched: number;
  topGenres: { name: string; count: number }[];
  monthly: { label: string; count: number }[];
}

export function useProfileStats(): ProfileStats | undefined {
  return useLiveQuery(async () => {
    let rows: HistoryRow[] = [];
    try {
      const d = db();
      if (!d) return undefined;
      rows = await d.history.toArray();
    } catch {
      return undefined;
    }

    let episodes = 0;
    const genreCount = new Map<string, number>();
    const monthBuckets = new Map<string, number>();

    // Подготавливаем 6 месяцев назад от текущего.
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("ru-RU", { month: "short" });
      months.push({ key, label });
      monthBuckets.set(key, 0);
    }

    for (const r of rows) {
      const watched = r.watchedEpisodes?.length ?? r.episode ?? 0;
      episodes += watched;
      for (const g of r.anime.genres ?? []) {
        genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
      }
      const dt = new Date(r.updatedAt);
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (monthBuckets.has(k)) {
        monthBuckets.set(k, (monthBuckets.get(k) ?? 0) + watched);
      }
    }

    const topGenres = Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      totalAnime: rows.length,
      totalEpisodes: episodes,
      hoursWatched: Math.round((episodes * 24) / 60),
      topGenres,
      monthly: months.map((m) => ({
        label: m.label,
        count: monthBuckets.get(m.key) ?? 0,
      })),
    };
  }, []);
}

/** Список номеров просмотренных серий для отметок в списке эпизодов. */
export function useWatchedEpisodes(animeId: string | undefined): number[] {
  return (
    useLiveQuery(
      async () => {
        try {
          const d = db();
          if (!d || !animeId) return [];
          const record = await d.history.get(animeId);
          return record?.watchedEpisodes ?? [];
        } catch {
          return [];
        }
      },
      [animeId],
      [],
    ) ?? []
  );
}

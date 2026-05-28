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

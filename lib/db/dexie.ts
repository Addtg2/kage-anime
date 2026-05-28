"use client";

import Dexie, { type EntityTable } from "dexie";

import type { Anime } from "@/lib/anime/types";

export interface HistoryRow {
  animeId: string;
  anime: Anime;
  episode: number;
  updatedAt: number;
}

class KageDB extends Dexie {
  history!: EntityTable<HistoryRow, "animeId">;

  constructor() {
    super("kage-db-v1");
    this.version(1).stores({
      // ключ — animeId, индекс по updatedAt для рейла «Продолжить смотреть»
      history: "animeId, updatedAt",
    });
  }
}

let _db: KageDB | null = null;

/** Возвращает singleton БД или null на сервере (Dexie работает только в браузере). */
export function db(): KageDB | null {
  if (typeof window === "undefined") return null;
  if (!_db) _db = new KageDB();
  return _db;
}

/** Записывает факт просмотра серии в локальную историю. No-op на сервере. */
export async function recordWatch(anime: Anime, episode: number) {
  const d = db();
  if (!d) return;
  await d.history.put({
    animeId: anime.id,
    anime,
    episode,
    updatedAt: Date.now(),
  });
}

/** Полная очистка истории — для страницы профиля. */
export async function clearHistory() {
  const d = db();
  if (!d) return;
  await d.history.clear();
}

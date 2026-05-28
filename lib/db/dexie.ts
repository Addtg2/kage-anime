"use client";

import Dexie, { type EntityTable } from "dexie";

import type { Anime } from "@/lib/anime/types";

export interface HistoryRow {
  animeId: string;
  anime: Anime;
  episode: number;
  updatedAt: number;
  watchedEpisodes?: number[];
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
  const prev = await d.history.get(anime.id);
  const watched = new Set(prev?.watchedEpisodes ?? []);
  watched.add(episode);
  await d.history.put({
    animeId: anime.id,
    anime,
    episode,
    updatedAt: Date.now(),
    watchedEpisodes: Array.from(watched).sort((a, b) => a - b),
  });
}

/** Отметить серию как просмотренную, не двигая «последний эпизод». */
export async function markEpisodeWatched(anime: Anime, episode: number) {
  const d = db();
  if (!d) return;
  const prev = await d.history.get(anime.id);
  const watched = new Set(prev?.watchedEpisodes ?? []);
  watched.add(episode);
  await d.history.put({
    animeId: anime.id,
    anime,
    episode: prev?.episode ?? episode,
    updatedAt: prev?.updatedAt ?? Date.now(),
    watchedEpisodes: Array.from(watched).sort((a, b) => a - b),
  });
}

/** Снять отметку «просмотрено» с серии. */
export async function unmarkEpisodeWatched(animeId: string, episode: number) {
  const d = db();
  if (!d) return;
  const prev = await d.history.get(animeId);
  if (!prev) return;
  const watched = (prev.watchedEpisodes ?? []).filter((e) => e !== episode);
  await d.history.put({ ...prev, watchedEpisodes: watched });
}

/** Полная очистка истории — для страницы профиля. */
export async function clearHistory() {
  const d = db();
  if (!d) return;
  await d.history.clear();
}

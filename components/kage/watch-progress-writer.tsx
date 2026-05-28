"use client";

import { useEffect } from "react";

import { recordWatch } from "@/lib/db/dexie";
import type { Anime } from "@/lib/anime/types";

/**
 * Пишет в локальную историю факт просмотра (animeId, episode, updatedAt).
 * Просто маунтится на странице просмотра — никакого UI.
 */
export function WatchProgressWriter({
  anime,
  episode,
}: {
  anime: Anime;
  episode: number;
}) {
  useEffect(() => {
    recordWatch(anime, episode).catch((e) => {
      console.warn("[KAGE] не удалось записать историю", e);
    });
  }, [anime, episode]);

  return null;
}

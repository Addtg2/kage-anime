"use client";

import { useEffect, useRef } from "react";

import { recordWatch, recordWatchTime } from "@/lib/db/dexie";
import type { Anime } from "@/lib/anime/types";

/**
 * Пишет в локальную историю факт просмотра (animeId, episode, updatedAt).
 * Дополнительно слушает postMessage от Kodik-iframe и сохраняет таймкод (G1).
 * Записывает время не чаще, чем раз в 10 секунд, чтобы не нагружать IndexedDB.
 */
export function WatchProgressWriter({
  anime,
  episode,
}: {
  anime: Anime;
  episode: number;
}) {
  const lastWriteRef = useRef(0);

  useEffect(() => {
    recordWatch(anime, episode).catch((e) => {
      console.warn("[KAGE] не удалось записать историю", e);
    });
    lastWriteRef.current = 0;
  }, [anime, episode]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Kodik шлёт сообщения вида { key: "kodik_player_time_update", value: { time, duration } }.
      // Принимаем формат гибко — некоторые сборки шлют просто string-ключ.
      const raw = e.data as unknown;
      if (!raw || typeof raw !== "object") return;
      const data = raw as { key?: string; value?: unknown };
      if (typeof data.key !== "string") return;
      const key = data.key;
      if (key !== "kodik_player_time_update" && key !== "kodik_player_play")
        return;
      const val = data.value as
        | { time?: number; duration?: number }
        | undefined;
      const time = typeof val?.time === "number" ? val.time : NaN;
      const duration =
        typeof val?.duration === "number" ? val.duration : undefined;
      if (!Number.isFinite(time) || time < 1) return;

      const now = Date.now();
      if (now - lastWriteRef.current < 10_000) return;
      lastWriteRef.current = now;

      recordWatchTime(anime.id, episode, time, duration).catch((err) => {
        console.warn("[KAGE] не удалось записать таймкод", err);
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [anime.id, episode]);

  return null;
}

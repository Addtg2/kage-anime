"use client";

import { useEffect } from "react";

import { useSettingsStore } from "@/lib/store/settings";

// Сторожок локальных уведомлений: при монтировании читает подписки и ставит
// setTimeout на ближайшие выходы серий (в пределах 24 часов). Когда время
// приходит — показывает Notification и снимает подписку. Без сервера: работает,
// пока вкладка открыта.
export function NotificationScheduler() {
  const subs = useSettingsStore((s) => s.episodeSubs);
  const removeSub = useSettingsStore((s) => s.removeEpisodeSub);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();
    const horizon = 24 * 60 * 60 * 1000;

    for (const sub of Object.values(subs)) {
      const at = new Date(sub.nextAt).getTime();
      const delay = at - now;
      if (delay <= 0) {
        // Серия уже должна была выйти — снимаем подписку молча.
        removeSub(sub.animeId);
        continue;
      }
      if (delay > horizon) continue;

      const t = setTimeout(() => {
        try {
          new Notification(`KAGE — ${sub.titleRu}`, {
            body: `Серия ${sub.nextEpisode} вышла!`,
            tag: `kage-ep-${sub.animeId}`,
            icon: "/icon.svg",
          });
        } catch {
          // Notification может бросить в фоне — игнор.
        }
        removeSub(sub.animeId);
      }, delay);
      timers.push(t);
    }

    return () => timers.forEach(clearTimeout);
  }, [subs, removeSub]);

  return null;
}

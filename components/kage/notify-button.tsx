"use client";

import { Bell, BellOff } from "lucide-react";

import { useSettingsStore } from "@/lib/store/settings";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils";

interface Props {
  animeId: string;
  titleRu: string;
  nextAt: string; // ISO
  nextEpisode: number;
}

export function NotifyButton({ animeId, titleRu, nextAt, nextEpisode }: Props) {
  const hydrated = useHydrated();
  const subscribed = useSettingsStore((s) => !!s.episodeSubs[animeId]);
  const addSub = useSettingsStore((s) => s.addEpisodeSub);
  const removeSub = useSettingsStore((s) => s.removeEpisodeSub);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (subscribed) {
      removeSub(animeId);
      return;
    }
    if (typeof Notification === "undefined") {
      alert("Браузер не поддерживает уведомления.");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") {
      alert("Уведомления отключены в настройках браузера.");
      return;
    }
    addSub({ animeId, titleRu, nextAt, nextEpisode });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={subscribed ? "Отключить уведомление" : "Включить уведомление"}
      aria-pressed={subscribed}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
        hydrated && subscribed
          ? "border-brand bg-brand/15 text-brand"
          : "border-border bg-surface text-text-dim hover:border-border-hi hover:text-foreground",
      )}
    >
      {hydrated && subscribed ? (
        <Bell className="size-3" fill="currentColor" />
      ) : (
        <BellOff className="size-3" />
      )}
    </button>
  );
}

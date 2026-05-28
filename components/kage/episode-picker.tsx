"use client";

import Link from "next/link";
import { CheckCircle2, Play } from "lucide-react";

import { useLastSeen } from "@/lib/db/hooks";
import { cn } from "@/lib/utils";

/**
 * Боковая панель эпизодов на странице просмотра. На десктопе — справа от плеера
 * вертикальная колонка; на мобильных — горизонтальный скроллер сверху.
 * Активный эпизод подсвечен; просмотренные (по локальной истории Dexie) —
 * с зелёной галкой.
 */
export function EpisodePicker({
  animeId,
  episodes,
  current,
}: {
  animeId: string;
  episodes: number[];
  current: number;
}) {
  const lastSeen = useLastSeen(animeId);
  const watchedUpTo = lastSeen?.episode ?? 0;

  if (episodes.length === 0) return null;

  return (
    <aside className="flex flex-col overflow-hidden rounded-xl border border-border bg-bg-elev">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-base text-foreground">Эпизоды</h2>
        <span className="text-xs text-text-dim">{episodes.length} серий</span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto p-2 lg:max-h-[480px] lg:flex-col lg:overflow-y-auto lg:p-2">
        {episodes.map((num) => {
          const active = num === current;
          const watched = watchedUpTo >= num;
          return (
            <Link
              key={num}
              href={`/anime/${animeId}/watch?ep=${num}`}
              scroll={false}
              prefetch={false}
              className={cn(
                "group flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors lg:shrink",
                active
                  ? "border-brand bg-surface text-foreground"
                  : "border-border bg-surface/50 text-text-dim hover:border-border-hi hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                  active
                    ? "bg-brand text-white"
                    : watched
                      ? "bg-surface-2 text-foreground"
                      : "bg-surface-2 text-text-dim",
                )}
              >
                {active ? (
                  <Play className="size-3" fill="currentColor" strokeWidth={0} />
                ) : (
                  String(num).padStart(2, "0")
                )}
              </div>
              <span className="hidden flex-1 truncate text-left lg:inline">
                Серия {num}
              </span>
              {watched && !active && (
                <CheckCircle2 className="size-4 shrink-0 text-text-mute lg:ml-auto" />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

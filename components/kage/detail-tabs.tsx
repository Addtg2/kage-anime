"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Check, Play, RotateCcw } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import type { ShikiScreenshot } from "@/lib/shikimori/types";
import { useWatchedEpisodes } from "@/lib/db/hooks";
import { cn } from "@/lib/utils";
import { KageBackdrop } from "./backdrop";
import { KagePoster } from "./poster";
import { useDragScroll } from "./use-drag-scroll";

interface Ep {
  num: number;
  title: string;
  duration: number;
}

type TabId = "episodes" | "similar";

export function DetailTabs({
  anime,
  episodes,
  similar,
  screenshots,
  episodesAired = 0,
  nextEpisodeAt = null,
  player = null,
}: {
  anime: Anime;
  episodes: Ep[];
  similar: Anime[];
  screenshots?: ShikiScreenshot[];
  episodesAired?: number;
  nextEpisodeAt?: string | null;
  /** Встроенный плеер — рендерится в табе «Эпизоды» вместо сетки серий. */
  player?: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("episodes");

  const tabs: { id: TabId; label: string }[] = [
    { id: "episodes", label: "Эпизоды" },
    { id: "similar", label: "Похожее" },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Детали аниме"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-[clamp(1rem,4vw,3.5rem)] sm:gap-2"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-4 text-[13px] transition-colors sm:px-4",
              tab === t.id
                ? "border-brand font-semibold text-foreground"
                : "border-transparent font-medium text-text-dim hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="px-[clamp(1rem,4vw,3.5rem)] py-[clamp(1.5rem,2.5vw,2rem)]"
      >
        {tab === "episodes" &&
          (player ?? (
            <Episodes
              anime={anime}
              episodes={episodes}
              screenshots={screenshots}
              episodesAired={episodesAired}
              nextEpisodeAt={nextEpisodeAt}
            />
          ))}
        {tab === "similar" && <Similar items={similar} />}
      </div>
    </div>
  );
}

function Episodes({
  anime,
  episodes,
  screenshots,
  episodesAired,
  nextEpisodeAt,
}: {
  anime: Anime;
  episodes: Ep[];
  screenshots?: ShikiScreenshot[];
  episodesAired: number;
  nextEpisodeAt: string | null;
}) {
  const watched = useWatchedEpisodes(anime.id);
  const watchedSet = new Set(watched);

  // Дата следующей серии. Для серий после неё считаем недельным шагом —
  // у Shikimori точного расписания нет, но почти все TV-сериалы выходят раз в неделю.
  const nextAtMs = nextEpisodeAt ? Date.parse(nextEpisodeAt) : NaN;

  if (episodes.length === 0) {
    return (
      <p className="text-sm text-text-dim">
        Список эпизодов появится после старта показа.
      </p>
    );
  }
  return (
    <div
      className="grid gap-x-4 gap-y-5"
      style={{
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
      }}
    >
      {episodes.map((ep) => {
        const isWatched = watchedSet.has(ep.num);
        const isAired = ep.num <= episodesAired;
        const airAt =
          !isAired && Number.isFinite(nextAtMs)
            ? new Date(nextAtMs + (ep.num - episodesAired - 1) * 7 * 86_400_000)
            : null;

        const card = (
          <>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface transition-transform group-hover:-translate-y-0.5">
              {screenshots && screenshots.length > 0 && isAired ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshots[(ep.num - 1) % screenshots.length].x166Url ?? screenshots[(ep.num - 1) % screenshots.length].originalUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60" />
                </>
              ) : (
                <KageBackdrop anime={{ ...anime, posterUrl: undefined }} rounded={8}>
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60",
                    !isAired && "bg-black/65 backdrop-blur-sm",
                  )} />
                </KageBackdrop>
              )}
              <div className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0a0a0f] transition-transform group-hover:scale-110">
                {!isAired ? (
                  <CalendarClock className="size-4" strokeWidth={2.5} />
                ) : isWatched ? (
                  <RotateCcw className="size-4" strokeWidth={2.5} />
                ) : (
                  <Play className="size-4" fill="currentColor" strokeWidth={0} />
                )}
              </div>
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {ep.duration} мин
              </span>
              {isWatched && isAired && (
                <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-white shadow">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className="absolute left-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                {String(ep.num).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-2 min-w-0">
              <div
                className={cn(
                  "mb-0.5 text-[10.5px] uppercase tracking-[0.14em]",
                  !isAired
                    ? "text-text-mute"
                    : isWatched
                      ? "text-brand"
                      : "text-text-dim",
                )}
              >
                {!isAired
                  ? airAt
                    ? formatAirDate(airAt)
                    : "Скоро"
                  : isWatched
                    ? "Просмотрено"
                    : `Серия ${ep.num}`}
              </div>
              <div
                className={cn(
                  "font-display line-clamp-1 leading-tight text-[15px]",
                  (isWatched || !isAired) && "text-text-dim",
                )}
              >
                {ep.title}
              </div>
            </div>
          </>
        );

        if (!isAired) {
          return (
            <div
              key={ep.num}
              aria-disabled
              className="group cursor-not-allowed opacity-75"
            >
              {card}
            </div>
          );
        }

        return (
          <Link
            key={ep.num}
            href={`/anime/${anime.id}?ep=${ep.num}#player`}
            className="group block"
          >
            {card}
          </Link>
        );
      })}
    </div>
  );
}

const AIR_DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAirDate(d: Date): string {
  return AIR_DATE_FMT.format(d).replace(",", " ·");
}

function Similar({ items }: { items: Anime[] }) {
  const { ref, onPointerDown, onDragStart, didDrag } = useDragScroll<HTMLDivElement>();
  if (items.length === 0) {
    return <p className="text-sm text-text-dim">Похожих тайтлов не нашлось.</p>;
  }
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onDragStart={onDragStart}
      className="no-scrollbar -mx-[clamp(1rem,4vw,3.5rem)] cursor-grab select-none overflow-x-auto px-[clamp(1rem,4vw,3.5rem)] active:cursor-grabbing"
    >
      <div className="flex gap-3 sm:gap-4">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/anime/${a.id}`}
            onClick={(e) => {
              if (didDrag()) e.preventDefault();
            }}
            className="w-[clamp(132px,15vw,200px)] shrink-0 transition-transform hover:-translate-y-1"
          >
            <KagePoster anime={a} dense />
          </Link>
        ))}
      </div>
    </div>
  );
}

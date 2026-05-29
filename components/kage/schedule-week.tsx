"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { NotifyButton } from "@/components/kage/notify-button";
import { useHydrated } from "@/lib/store/use-hydrated";

export interface ScheduleCardData {
  id: string;
  titleRu: string;
  posterUrl?: string;
  palette: [string, string, string];
  nextAt: string; // ISO string
  nextEpisode: number;
}

// Partial because some days may have no entries
export type GroupedSchedule = Partial<Record<number, ScheduleCardData[]>>;

// Display order Mon→Sun (JS getDay: 0=Sun, 1=Mon … 6=Sat)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_LABELS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleWeek({ schedule }: { schedule: GroupedSchedule }) {
  const hydrated = useHydrated();
  // Default to Monday on SSR/first render to avoid mismatch; switch to real
  // "today" once hydrated.
  const todayIdx = hydrated ? DAY_ORDER.indexOf(new Date().getDay()) : 0;
  const [selected, setSelected] = useState<number | null>(null);
  const activeIdx = selected ?? todayIdx;
  const activeDay = DAY_ORDER[activeIdx];
  const activeCards = schedule[activeDay] ?? [];

  return (
    <>
      {/* Mobile: horizontal day tabs + vertical card list */}
      <div className="lg:hidden">
        <div className="-mx-[clamp(1rem,3vw,2.5rem)] overflow-x-auto px-[clamp(1rem,3vw,2.5rem)] pb-3">
          <div className="flex gap-2">
            {DAY_ORDER.map((day, i) => {
              const isActive = i === activeIdx;
              const isToday = i === todayIdx;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`flex min-h-11 shrink-0 flex-col items-center justify-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : "bg-surface-2 text-text-dim hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span>{DAY_LABELS[i]}</span>
                  {isToday && (
                    <span
                      className={`mt-0.5 text-[9px] uppercase tracking-wider ${
                        isActive ? "text-white/80" : "text-brand"
                      }`}
                    >
                      сегодня
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-text-dim">
          {DAY_LABELS_FULL[activeIdx]}
          {activeCards.length > 0 && (
            <span className="ml-2 text-text-mute">· {activeCards.length}</span>
          )}
        </h2>

        {activeCards.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-mute">
            На этот день нет онгоингов.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/anime/${card.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-hi hover:bg-surface-2"
                >
                  <div
                    className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg"
                    style={{ background: card.palette[0] }}
                  >
                    {card.posterUrl && (
                      <Image
                        src={card.posterUrl}
                        alt={card.titleRu}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                      {card.titleRu}
                    </p>
                    <p className="text-xs text-text-dim">
                      Сер. {card.nextEpisode}
                      <span className="mx-1.5 text-text-mute">·</span>
                      <span className="font-semibold text-brand">
                        {formatTime(card.nextAt)}
                      </span>
                    </p>
                  </div>
                  <NotifyButton
                    animeId={card.id}
                    titleRu={card.titleRu}
                    nextAt={card.nextAt}
                    nextEpisode={card.nextEpisode}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop: 7-column week grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-3">
          {DAY_ORDER.map((day, i) => {
            const isToday = i === todayIdx;
            const cards = schedule[day] ?? [];

            return (
              <div key={day} className="flex flex-col gap-2">
                <div
                  className={`rounded-lg px-2 py-2 text-center text-xs font-semibold tracking-wide ${
                    isToday
                      ? "bg-brand text-white"
                      : "bg-surface-2 text-text-dim"
                  }`}
                >
                  {DAY_LABELS[i]}
                </div>

                {cards.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface px-2 py-6 text-center text-xs text-text-mute">
                    —
                  </div>
                ) : (
                  cards.map((card) => (
                    <Link
                      key={card.id}
                      href={`/anime/${card.id}`}
                      className="group flex gap-2 rounded-xl border border-border bg-surface p-2 transition-colors hover:border-border-hi hover:bg-surface-2"
                    >
                      <div
                        className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: card.palette[0] }}
                      >
                        {card.posterUrl && (
                          <Image
                            src={card.posterUrl}
                            alt={card.titleRu}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="line-clamp-3 text-[11px] font-medium leading-tight text-foreground">
                            {card.titleRu}
                          </p>
                          <NotifyButton
                            animeId={card.id}
                            titleRu={card.titleRu}
                            nextAt={card.nextAt}
                            nextEpisode={card.nextEpisode}
                          />
                        </div>
                        <p className="mt-auto text-[10px] text-text-dim">
                          Сер. {card.nextEpisode}
                        </p>
                        <p className="text-[10px] font-semibold text-brand">
                          {formatTime(card.nextAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

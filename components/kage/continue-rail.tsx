"use client";

import Link from "next/link";
import { Play } from "lucide-react";

import { useResume } from "@/lib/db/hooks";
import { KagePoster } from "./poster";

const POSTER_W = "w-[clamp(132px,15vw,200px)]";

/**
 * Рейл «Продолжить смотреть» — последние просмотренные тайтлы из локальной
 * истории (Dexie). Скрывается, если истории нет. Каждая карточка ведёт сразу
 * на нужную серию.
 */
export function ContinueRail() {
  const rows = useResume(12);

  if (!rows || rows.length === 0) return null;

  return (
    <section className="relative">
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,2.5rem)] sm:mb-4">
        <div>
          <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
            Продолжить смотреть
          </h2>
          <div className="mt-1 text-xs text-text-dim sm:text-sm">
            Где вы остановились
          </div>
        </div>
      </div>

      <div className="no-scrollbar overflow-x-auto px-[clamp(1rem,4vw,2.5rem)]">
        <div className="flex gap-3 sm:gap-4">
          {rows.map(({ anime, episode }) => (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}/watch?ep=${episode}`}
              className={`${POSTER_W} group shrink-0 transition-transform duration-200 hover:-translate-y-1`}
            >
              <div className="relative">
                <KagePoster anime={anime} dense showTitle={false} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2.5 pb-2.5 pt-8">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-white">
                    <Play
                      className="size-3"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    Эпизод {episode}
                  </div>
                  <div className="line-clamp-1 font-display text-[14px] leading-tight text-white">
                    {anime.titleRu}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

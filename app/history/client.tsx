"use client";

import Link from "next/link";
import { Trash2, Play, History as HistoryIcon } from "lucide-react";

import { useResume } from "@/lib/db/hooks";
import { db } from "@/lib/db/dexie";
import { useHydrated } from "@/lib/store/use-hydrated";
import { KagePoster } from "@/components/kage/poster";
import { cn } from "@/lib/utils";

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн назад`;
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function HistoryClient() {
  const hydrated = useHydrated();
  const rows = useResume(500);

  async function remove(animeId: string) {
    const d = db();
    if (!d) return;
    await d.history.delete(animeId);
  }

  async function clearAll() {
    const d = db();
    if (!d) return;
    if (!confirm("Очистить всю историю?")) return;
    await d.history.clear();
  }

  if (!hydrated || !rows) {
    return (
      <div className="mx-auto max-w-[1600px] py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
        <div className="h-24 w-72 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-none">
            История
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            {rows.length > 0
              ? `${rows.length} тайтл${rows.length === 1 ? "" : rows.length < 5 ? "а" : "ов"} в истории`
              : "История пуста — начните смотреть, чтобы она появилась"}
          </p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-text-dim transition-colors hover:border-brand hover:text-brand"
          >
            <Trash2 className="size-3.5" />
            Очистить
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface/40 py-20 text-center">
          <HistoryIcon className="size-12 text-text-mute" />
          <p className="text-text-dim">Здесь будет список просмотренного.</p>
          <Link
            href="/catalog"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            К каталогу
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.animeId}
              className={cn(
                "group flex items-center gap-4 rounded-2xl border border-border bg-surface/50 p-3 transition-colors hover:border-border-hi",
              )}
            >
              <Link
                href={`/anime/${row.animeId}`}
                className="block w-[80px] shrink-0 sm:w-[110px]"
              >
                <KagePoster anime={row.anime} dense />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/anime/${row.animeId}`}
                  className="line-clamp-2 font-display text-base leading-tight hover:text-brand sm:text-lg"
                >
                  {row.anime.titleRu}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim">
                  <span>Серия {row.episode}</span>
                  {row.watchedEpisodes && row.watchedEpisodes.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{row.watchedEpisodes.length} просмотрено</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatWhen(row.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/anime/${row.animeId}?ep=${row.episode}#player`}
                  className="flex h-9 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-medium text-white transition hover:opacity-90"
                  aria-label="Продолжить"
                >
                  <Play className="size-3.5" fill="currentColor" />
                  <span className="hidden sm:inline">Продолжить</span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(row.animeId)}
                  aria-label="Удалить из истории"
                  className="flex size-9 items-center justify-center rounded-full border border-border text-text-dim transition-colors hover:border-brand hover:text-brand"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Film, Tv, Disc, Sparkles } from "lucide-react";

import { useLibraryStore, LIBRARY_STATUSES } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils";

export interface FranchiseEntry {
  id: string;
  titleRu: string;
  kind: string | null;
  year: number | null;
  episodes: number;
  status: string | null;
  posterUrl: string | null;
  airedDate: string | null;
}

// Иконка по типу тайтла Shikimori. tv/tv_24/tv_48 → телевизор,
// movie → кино, ova/ona/special → диск, остальное → искра.
function KindIcon({ kind }: { kind: string | null }) {
  const k = kind ?? "";
  if (k.startsWith("movie")) return <Film className="size-3.5" aria-hidden />;
  if (k.startsWith("tv")) return <Tv className="size-3.5" aria-hidden />;
  if (k === "ova" || k === "ona" || k === "special")
    return <Disc className="size-3.5" aria-hidden />;
  return <Sparkles className="size-3.5" aria-hidden />;
}

const KIND_LABEL: Record<string, string> = {
  tv: "TV",
  tv_24: "TV",
  tv_48: "TV",
  movie: "Фильм",
  ova: "OVA",
  ona: "ONA",
  special: "Спецвыпуск",
  music: "Клип",
};

function kindLabel(kind: string | null): string {
  if (!kind) return "—";
  return KIND_LABEL[kind] ?? kind.toUpperCase();
}

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  LIBRARY_STATUSES.map((s) => [s.id, s.label]),
);

interface Props {
  items: FranchiseEntry[];
  currentId: string;
}

export function FranchiseRail({ items, currentId }: Props) {
  const entries = useLibraryStore((s) => s.entries);
  const hydrated = useHydrated();

  if (items.length <= 1) return null;

  return (
    <section className="border-b border-border py-[clamp(1.5rem,3vw,2.5rem)]">
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,3.5rem)] sm:mb-4">
        <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
          Порядок просмотра
        </h2>
        <span className="text-xs text-text-dim">{items.length} в франшизе</span>
      </div>

      <ol className="flex flex-col gap-2 px-[clamp(1rem,4vw,3.5rem)]">
        {items.map((it, i) => {
          const isCurrent = it.id === currentId;
          const libStatus = hydrated ? entries[it.id]?.status : undefined;
          const statusLabel = libStatus ? STATUS_LABEL[libStatus] : null;
          return (
            <li key={it.id}>
              <Link
                href={`/anime/${it.id}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border p-2 pr-3 transition-colors",
                  isCurrent
                    ? "border-brand bg-brand/10"
                    : "border-border bg-surface/40 hover:border-border-hi hover:bg-surface",
                )}
              >
                <div className="flex w-6 shrink-0 justify-center font-display text-sm text-text-dim tabular-nums">
                  {i + 1}
                </div>
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:size-14">
                  {it.posterUrl ? (
                    <Image
                      src={it.posterUrl}
                      alt={it.titleRu}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div
                      className={cn(
                        "truncate font-medium",
                        isCurrent ? "text-brand" : "text-foreground",
                      )}
                    >
                      {it.titleRu}
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                        сейчас
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-dim">
                    <span className="inline-flex items-center gap-1">
                      <KindIcon kind={it.kind} />
                      {kindLabel(it.kind)}
                    </span>
                    {it.year != null && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{it.year}</span>
                      </>
                    )}
                    {it.episodes > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{it.episodes} эп.</span>
                      </>
                    )}
                  </div>
                </div>
                {statusLabel && (
                  <span className="ml-auto hidden shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim sm:inline">
                    {statusLabel}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

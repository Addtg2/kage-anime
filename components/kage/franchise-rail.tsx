"use client";

import Link from "next/link";
import Image from "next/image";
import { Film, Tv, Disc, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDragScroll } from "./use-drag-scroll";

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

// Иконка по типу тайтла Shikimori.
function KindIcon({ kind }: { kind: string | null }) {
  const k = kind ?? "";
  if (k.startsWith("movie")) return <Film className="size-3" aria-hidden />;
  if (k.startsWith("tv")) return <Tv className="size-3" aria-hidden />;
  if (k === "ova" || k === "ona" || k === "special")
    return <Disc className="size-3" aria-hidden />;
  return <Sparkles className="size-3" aria-hidden />;
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

interface Props {
  items: FranchiseEntry[];
  currentId: string;
}

export function FranchiseRail({ items, currentId }: Props) {
  const { ref, onPointerDown, onDragStart, didDrag } = useDragScroll<HTMLOListElement>();
  if (items.length <= 1) return null;

  return (
    <section className="border-b border-border py-[clamp(1.5rem,3vw,2.5rem)]">
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,3.5rem)] sm:mb-4">
        <h2 className="font-display flex items-center gap-2.5 text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
          <span className="h-[1.1em] w-1 shrink-0 rounded-full bg-brand" />
          Порядок просмотра
        </h2>
        <span className="text-xs text-text-dim">{items.length} в франшизе</span>
      </div>

      <ol
        ref={ref}
        onPointerDown={onPointerDown}
        onDragStart={onDragStart}
        className="no-scrollbar flex cursor-grab select-none gap-3 overflow-x-auto px-[clamp(1rem,4vw,3.5rem)] pb-1 active:cursor-grabbing"
      >
        {items.map((it, i) => {
          const isCurrent = it.id === currentId;
          return (
            <li key={it.id} className="w-[clamp(116px,13vw,150px)] shrink-0">
              <Link
                href={`/anime/${it.id}`}
                aria-current={isCurrent ? "page" : undefined}
                onClick={(e) => {
                  if (didDrag()) e.preventDefault();
                }}
                className="group block"
              >
                <div
                  className={cn(
                    "relative aspect-[2/3] overflow-hidden rounded-xl border bg-surface-2 transition-all",
                    isCurrent
                      ? "border-brand ring-2 ring-brand/40"
                      : "border-border group-hover:-translate-y-1 group-hover:border-border-hi",
                  )}
                >
                  {it.posterUrl && (
                    <Image
                      src={it.posterUrl}
                      alt={it.titleRu}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  )}
                  {/* порядковый номер */}
                  <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-black/70 text-xs font-bold tabular-nums text-white backdrop-blur-sm">
                    {i + 1}
                  </span>
                  {isCurrent && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow">
                      сейчас
                    </span>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                </div>

                <div className="mt-1.5 min-w-0">
                  <div
                    className={cn(
                      "line-clamp-2 text-[13px] font-medium leading-tight",
                      isCurrent ? "text-brand" : "text-foreground",
                    )}
                  >
                    {it.titleRu}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-dim">
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
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

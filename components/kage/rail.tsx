"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import { cn } from "@/lib/utils";
import { KagePoster } from "./poster";

const POSTER_W = "w-[clamp(132px,15vw,200px)]";

export function AnimeRail({
  title,
  subtitle,
  items,
  href,
}: {
  title: string;
  subtitle?: string;
  items: Anime[];
  /** Ссылка «Смотреть все» — обычно фильтр каталога. */
  href?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    skipSnaps: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync).on("reInit", sync);
  }, [emblaApi, sync]);

  if (items.length === 0) return null;

  return (
    <section className="relative">
      <div className="mb-3 flex items-end justify-between gap-4 px-[clamp(1rem,4vw,2.5rem)] sm:mb-4">
        <div className="min-w-0">
          <h2 className="font-display flex items-center gap-2.5 text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
            <span className="h-[1.1em] w-1 shrink-0 rounded-full bg-brand" />
            {title}
          </h2>
          {subtitle && (
            <div className="mt-1 pl-[18px] text-xs text-text-dim sm:text-sm">
              {subtitle}
            </div>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="group flex shrink-0 items-center gap-1 text-xs font-medium text-text-dim transition-colors hover:text-brand sm:text-sm"
          >
            Смотреть все
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden px-[clamp(1rem,4vw,2.5rem)]">
          <div className="flex gap-3 sm:gap-4">
            {items.map((a) => (
              <Link
                key={a.id}
                href={`/anime/${a.id}`}
                className={cn(
                  POSTER_W,
                  "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:scale-[1.03]",
                )}
              >
                <KagePoster anime={a} dense />
              </Link>
            ))}
          </div>
        </div>

        <ArrowButton
          direction="prev"
          show={canPrev}
          onClick={() => emblaApi?.scrollPrev()}
        />
        <ArrowButton
          direction="next"
          show={canNext}
          onClick={() => emblaApi?.scrollNext()}
        />
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  show,
  onClick,
}: {
  direction: "prev" | "next";
  show: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Назад" : "Вперёд"}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={cn(
        "absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-bg-elev/90 text-foreground shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-200 md:flex",
        direction === "prev" ? "left-2 lg:left-4" : "right-2 lg:right-4",
        show
          ? "opacity-100 hover:scale-105 hover:bg-bg-elev"
          : "pointer-events-none opacity-0",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

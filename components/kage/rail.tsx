"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import { cn } from "@/lib/utils";
import { KagePoster } from "./poster";

const POSTER_W = "w-[clamp(132px,15vw,200px)]";

export function AnimeRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Anime[];
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
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,2.5rem)] sm:mb-4">
        <div>
          <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
            {title}
          </h2>
          {subtitle && (
            <div className="mt-1 text-xs text-text-dim sm:text-sm">{subtitle}</div>
          )}
        </div>
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
                  "shrink-0 transition-transform duration-200 hover:-translate-y-1",
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

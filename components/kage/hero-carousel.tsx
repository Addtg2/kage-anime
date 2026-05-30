"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Plus } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import { HeroBackdrop } from "@/components/kage/hero-backdrop";
import { HeroPosterCard } from "@/components/kage/hero-poster-card";
import { FadeIn } from "@/components/kage/fade-in";
import { Rating } from "@/components/kage/rating";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INTERVAL = 8000;

function Dot() {
  return <span className="size-[3px] rounded-full bg-text-dim" />;
}

function HeroSlide({
  anime,
  rank,
  priority,
  trailerUrl,
  active,
}: {
  anime: Anime;
  rank: number;
  priority?: boolean;
  trailerUrl?: string;
  active?: boolean;
}) {
  return (
    <>
      <HeroBackdrop
        anime={anime}
        priority={priority}
        trailerUrl={trailerUrl}
        active={active}
      />
      <HeroPosterCard anime={anime} trailerUrl={trailerUrl} />

      <FadeIn className="absolute inset-x-0 px-[clamp(1rem,4vw,2.5rem)] bottom-[clamp(3rem,7vw,6rem)]">
        <div className="max-w-2xl text-white">
          <div className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand sm:text-xs">
            <span className="h-px w-6 bg-brand" />
            №{rank} на этой неделе
          </div>

          {anime.titleJp && (
            <div className="mb-2.5 font-jp text-sm tracking-[0.1em] text-text-dim sm:text-base">
              {anime.titleJp}
            </div>
          )}

          <h1 className="font-display mb-4 leading-[0.95] text-[clamp(2.2rem,5.5vw,4.75rem)]">
            {anime.titleRu}
          </h1>

          <p className="mb-5 line-clamp-2 max-w-xl text-sm leading-relaxed text-foreground/85 sm:text-base">
            {anime.tagline}
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-text-dim">
            {anime.rating > 0 && (
              <>
                <Rating value={anime.rating} />
                <Dot />
              </>
            )}
            {anime.year > 0 && (
              <>
                <span>{anime.year}</span>
                <Dot />
              </>
            )}
            {anime.eps > 0 && (
              <>
                <span>{anime.eps} эп.</span>
                <Dot />
              </>
            )}
            {anime.age && <span>{anime.age}</span>}
            {anime.genres.length > 0 && (
              <span className="hidden items-center gap-3 sm:flex">
                <Dot />
                <span>{anime.genres.slice(0, 3).join(" · ")}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/anime/${anime.id}#player`}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              <Play fill="currentColor" strokeWidth={0} />
              Смотреть
            </Link>
            <Link
              href={`/anime/${anime.id}`}
              className={cn(buttonVariants({ variant: "glass", size: "lg" }))}
            >
              <Plus />
              Подробнее
            </Link>
          </div>
        </div>
      </FadeIn>
    </>
  );
}

export function HeroCarousel({
  items,
  trailers,
}: {
  items: Anime[];
  /** Ссылки на трейлеры по id аниме (для фонового видео активного слайда). */
  trailers?: Record<string, string>;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const goTo = useCallback(
    (idx: number) => {
      setActive(idx);
      setProgressKey((k) => k + 1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!reducedMotion && !paused) {
        timerRef.current = setInterval(() => {
          setActive((prev) => (prev + 1) % items.length);
          setProgressKey((k) => k + 1);
        }, INTERVAL);
      }
    },
    [items.length, paused, reducedMotion],
  );

  useEffect(() => {
    if (reducedMotion || paused || items.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
      setProgressKey((k) => k + 1);
    }, INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, reducedMotion, items.length]);

  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden h-[clamp(440px,52vw,660px)]"
      aria-roledescription="карусель"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
          goTo(dx < 0 ? (active + 1) % items.length : (active - 1 + items.length) % items.length);
        }
        setPaused(false);
      }}
    >
      {items.map((anime, i) => (
        <div
          key={anime.id}
          className="absolute inset-0 transition-opacity duration-[600ms] ease-out"
          style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
          aria-hidden={i !== active}
        >
          <HeroSlide
            anime={anime}
            rank={i + 1}
            priority={i === 0}
            trailerUrl={trailers?.[anime.id]}
            active={i === active}
          />
        </div>
      ))}

      {/* Progress bar */}
      {!reducedMotion && items.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/10">
          <div
            key={`${progressKey}-${paused}`}
            className="h-full bg-brand"
            style={{
              width: paused ? undefined : "100%",
              transition: paused ? "none" : `width ${INTERVAL}ms linear`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}

      {/* Dot navigation */}
      {items.length > 1 && (
        <div className="absolute bottom-5 right-[clamp(1rem,4vw,2.5rem)] flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Слайд ${i + 1} из ${items.length}`}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active
                  ? "size-2.5 bg-brand"
                  : "size-2 bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

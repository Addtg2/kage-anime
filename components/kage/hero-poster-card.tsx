"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { Anime } from "@/lib/anime/types";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const i = parts.indexOf("embed");
      if (i >= 0 && parts[i + 1]) return parts[i + 1]!;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Крупная резкая карточка реального постера в hero. Висит по центру-у справа,
 * с halo по палитре. На мобильных скрыта — на узких экранах вся работа идёт
 * через размытый бэкдроп под текстом (он рендерится отдельно в hero).
 * При hover (G4) — превью трейлера mute, если передан trailerUrl.
 */
export function HeroPosterCard({
  anime,
  trailerUrl,
}: {
  anime: Anime;
  trailerUrl?: string;
}) {
  const [c1, , c3] = anime.palette;
  const ytId = trailerUrl ? extractYouTubeId(trailerUrl) : null;
  const [previewActive, setPreviewActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!anime.posterUrl) return null;

  const onEnter = () => {
    if (!ytId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreviewActive(true), 600);
  };
  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreviewActive(false);
  };

  return (
    <div className="absolute top-1/2 z-10 hidden -translate-y-1/2 md:block right-[clamp(0.75rem,2.5vw,4rem)]">
      <div
        className="absolute inset-0 -z-10 opacity-60 blur-[90px]"
        style={{
          background: `radial-gradient(circle at 50% 55%, ${c3}, ${c1}99 35%, transparent 75%)`,
        }}
      />
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/80 w-[clamp(180px,20vw,360px)]"
        style={{
          transform: "rotate(2deg)",
          viewTransitionName: `poster-${anime.id}`,
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <Image
          src={anime.posterUrl}
          alt=""
          fill
          sizes="(min-width:1536px) 360px, (min-width:1024px) 280px, 200px"
          className="object-cover"
          priority
        />
        {ytId && previewActive && (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${ytId}&modestbranding=1&rel=0`}
            title={`Трейлер ${anime.titleRu}`}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 size-full border-0"
            style={{ pointerEvents: "none" }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 65%, ${c1}aa 100%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/12" />
      </div>
    </div>
  );
}

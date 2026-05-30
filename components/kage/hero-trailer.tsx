"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

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
 * Фоновый трейлер hero-слайда: muted-autoplay YouTube, растянутый на cover.
 * Монтируется только для активного слайда, с задержкой и плавным появлением.
 * Уважает prefers-reduced-motion (тогда не запускается — остаётся постер-фон).
 */
export function HeroTrailer({ url }: { url: string }) {
  const ytId = extractYouTubeId(url);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ytId) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // На мобильных трейлер-фон не грузим: экономия трафика + 16:9 не покрывает
    // высокий hero (леттербокс). Остаётся размытый постер.
    if (reduce || window.innerWidth < 768) return;
    const t = setTimeout(() => setMounted(true), 650);
    return () => clearTimeout(t);
  }, [ytId]);

  if (!ytId || !mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${ytId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`}
        title="Трейлер"
        allow="autoplay; encrypted-media"
        onLoad={() => setLoaded(true)}
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 aspect-video w-full -translate-x-1/2 -translate-y-1/2 scale-110 border-0 transition-opacity duration-1000",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

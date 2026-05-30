"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { X } from "lucide-react";

import type { ShikiScreenshot } from "@/lib/shikimori/types";

/**
 * Горизонтальный рейл скриншотов из Shikimori. Клик — lightbox с большой
 * картинкой. Используем нативный <img> чтобы не плодить remotePatterns
 * (originalUrl может быть на любом поддомене shikimori).
 */
export function ScreenshotsRail({
  screenshots,
}: {
  screenshots: ShikiScreenshot[];
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // Drag-to-scroll вбок (как лента серий в плеере). Move/up — на window.
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const el = scrollRef.current;
      if (!el || !drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.startScroll - dx;
    };
    const onUp = () => {
      drag.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0 || e.pointerType === "touch") return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIdx(null);
      if (e.key === "ArrowLeft")
        setActiveIdx((i) =>
          i === null ? null : (i + screenshots.length - 1) % screenshots.length,
        );
      if (e.key === "ArrowRight")
        setActiveIdx((i) =>
          i === null ? null : (i + 1) % screenshots.length,
        );
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeIdx, screenshots.length]);

  if (screenshots.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-[clamp(1rem,4vw,3.5rem)] sm:mb-4">
        <h2 className="font-display text-foreground text-[clamp(1.25rem,2vw,1.7rem)]">
          Кадры
        </h2>
        <span className="text-xs text-text-dim">
          {screenshots.length} шт.
        </span>
      </div>
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        className="no-scrollbar cursor-grab select-none overflow-x-auto px-[clamp(1rem,4vw,3.5rem)] active:cursor-grabbing"
      >
        <div className="flex gap-3 sm:gap-4">
          {screenshots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (drag.current.moved) return;
                setActiveIdx(i);
              }}
              className="relative aspect-video w-[clamp(220px,28vw,360px)] shrink-0 overflow-hidden rounded-lg border border-border bg-surface transition-transform hover:-translate-y-1"
              aria-label={`Скриншот ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.x166Url ?? s.originalUrl}
                alt=""
                loading="lazy"
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {activeIdx !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр кадра"
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setActiveIdx(null)}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-6xl">
            <button
              type="button"
              onClick={() => setActiveIdx(null)}
              aria-label="Закрыть"
              className="absolute -top-12 right-0 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshots[activeIdx].originalUrl}
              alt=""
              className="mx-auto max-h-[80vh] w-auto rounded-xl"
            />
            <div className="mt-3 text-center text-xs text-text-dim">
              {activeIdx + 1} / {screenshots.length} · ← → для навигации, Esc — закрыть
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

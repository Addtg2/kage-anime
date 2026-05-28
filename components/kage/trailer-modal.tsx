"use client";

import { useEffect } from "react";
import { Play, X } from "lucide-react";

import type { ShikiVideo } from "@/lib/shikimori/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Кнопка «Трейлер» рядом с «Смотреть» и модалка с YouTube-iframe.
 * Использует первый kind="pv" из Shikimori, иначе — первый kind="op".
 */
export function TrailerButton({
  videos,
  open,
  onOpenChange,
}: {
  videos: ShikiVideo[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const trailer = pickTrailer(videos);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!trailer) return null;

  const embedUrl = toEmbed(trailer.playerUrl ?? trailer.url);

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(buttonVariants({ variant: "glass", size: "lg" }))}
      >
        <Play fill="currentColor" strokeWidth={0} />
        Трейлер
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Трейлер"
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть"
              className="absolute -top-12 right-0 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-2xl shadow-black/80">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Трейлер"
                  className="size-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex size-full items-center justify-center text-text-dim">
                  Трейлер недоступен
                </div>
              )}
            </div>
            {trailer.name && (
              <div className="mt-3 text-center text-sm text-text-dim">
                {trailer.name}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function pickTrailer(videos: ShikiVideo[]): ShikiVideo | null {
  const pv = videos.find((v) => v.kind === "pv");
  if (pv) return pv;
  const op = videos.find((v) => v.kind === "op");
  if (op) return op;
  return videos[0] ?? null;
}

function toEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  // Shikimori отдаёт playerUrl как `//youtube.com/embed/ID` — оставляем как есть
  // (схема унаследуется), но добавим autoplay+rel=0 для приличия.
  let u = url.trim();
  if (u.startsWith("//")) u = `https:${u}`;
  // Преобразуем https://youtu.be/ID → https://youtube.com/embed/ID
  const m = u.match(/youtu\.be\/([\w-]+)/);
  if (m) u = `https://youtube.com/embed/${m[1]}`;
  // Прокинем autoplay/rel=0 если ещё нет
  if (u.includes("youtube.com/embed/")) {
    const sep = u.includes("?") ? "&" : "?";
    u = `${u}${sep}autoplay=1&rel=0&modestbranding=1`;
  }
  return u;
}

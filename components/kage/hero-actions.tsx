"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import type { ShikiVideo } from "@/lib/shikimori/types";
import { StatusButton } from "@/components/kage/status-button";
import { TrailerButton } from "@/components/kage/trailer-modal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResume } from "@/lib/db/hooks";

/**
 * Группа кнопок в hero: «Смотреть», «Трейлер» (если есть pv/op), «В список».
 * Выделено в client-компонент чтобы модалка трейлера управлялась локально.
 */
export function HeroActions({
  anime,
  canWatch,
  videos,
}: {
  anime: Anime;
  canWatch: boolean;
  videos: ShikiVideo[];
}) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const resume = useResume(20);
  const resumeEntry = resume?.find((r) => r.anime.id === anime.id);
  // Продолжаем с серии > 1 ИЛИ если есть сохранённый таймкод серии 1 (>30 сек).
  const resumeTime =
    resumeEntry?.timeSeconds && resumeEntry.timeSeconds > 30
      ? resumeEntry.timeSeconds
      : 0;
  const resumeEp =
    resumeEntry && (resumeEntry.episode > 1 || resumeTime > 0)
      ? resumeEntry.episode
      : null;

  const watchHref = resumeEp
    ? resumeTime > 0
      ? `/anime/${anime.id}?ep=${resumeEp}&start=${resumeTime}#player`
      : `/anime/${anime.id}?ep=${resumeEp}#player`
    : `/anime/${anime.id}#player`;

  const resumeLabel = resumeEp
    ? resumeTime > 0
      ? `Продолжить · Эп. ${resumeEp} · ${formatTime(resumeTime)}`
      : `Продолжить · Эп. ${resumeEp}`
    : "Смотреть с 1 серии";

  const hasTrailer = videos.some(
    (v) => v.kind === "pv" || v.kind === "op" || v.kind === "ed",
  );

  return (
    <div className="flex flex-wrap gap-2.5">
      {canWatch && (
        <Link
          href={watchHref}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
        >
          <Play fill="currentColor" strokeWidth={0} />
          {resumeLabel}
        </Link>
      )}
      {hasTrailer && (
        <TrailerButton
          videos={videos}
          open={trailerOpen}
          onOpenChange={setTrailerOpen}
        />
      )}
      <StatusButton anime={anime} size="lg" />
    </div>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

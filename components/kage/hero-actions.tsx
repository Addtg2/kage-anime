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
  const resumeEp = resumeEntry && resumeEntry.episode > 1 ? resumeEntry.episode : null;

  const hasTrailer = videos.some(
    (v) => v.kind === "pv" || v.kind === "op" || v.kind === "ed",
  );

  return (
    <div className="flex flex-wrap gap-2.5">
      {canWatch && (
        <Link
          href={resumeEp ? `/anime/${anime.id}/watch?ep=${resumeEp}` : `/anime/${anime.id}/watch`}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
        >
          <Play fill="currentColor" strokeWidth={0} />
          {resumeEp ? `Продолжить · Эп. ${resumeEp}` : "Смотреть с 1 серии"}
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

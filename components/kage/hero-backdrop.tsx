import Image from "next/image";

import type { Anime } from "@/lib/anime/types";
import { KageBackdrop } from "./backdrop";
import { HeroTrailer } from "./hero-trailer";

/**
 * Бэкдроп для hero: реальный постер тайтла, заполняющий весь блок и размытый
 * до атмосферного фона (как у AniList/Crunchyroll), + многослойные скримы для
 * читаемости текста. Если у тайтла нет постера — fallback на градиент палитры.
 * Для активного слайда с трейлером поверх постера проигрывается muted-видео.
 */
export function HeroBackdrop({
  anime,
  priority = true,
  trailerUrl,
  active = false,
}: {
  anime: Anime;
  priority?: boolean;
  trailerUrl?: string;
  active?: boolean;
}) {
  const [, c2] = anime.palette;
  return (
    <>
      {anime.posterUrl ? (
        <div className="absolute inset-0 kage-kenburns">
          <Image
            src={anime.posterUrl}
            alt=""
            fill
            sizes="100vw"
            priority={priority}
            className="object-cover opacity-70 blur-2xl"
          />
        </div>
      ) : (
        <KageBackdrop
          anime={anime}
          rounded={0}
          className="absolute inset-0"
        />
      )}

      {active && trailerUrl && <HeroTrailer url={trailerUrl} />}

      {/* лёгкий цветной halo по палитре, чтобы среда выглядела «киношно» */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 72% 40%, ${c2}55, transparent 65%)`,
        }}
      />
      {/* затемнение к низу — переход к фону страницы */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,15,0.45) 0%, transparent 38%, var(--background) 100%)",
        }}
      />
      {/* затемнение слева — под текстовым блоком hero */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--background) 0%, rgba(10,10,15,0.55) 38%, transparent 78%)",
        }}
      />
    </>
  );
}

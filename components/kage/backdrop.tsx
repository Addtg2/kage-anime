import type { ReactNode } from "react";
import Image from "next/image";

import type { Anime } from "@/lib/anime/types";
import { KAGE_FONTS } from "./fonts";

/**
 * Горизонтальный («ландшафтный») фон-плейсхолдер KAGE — для hero и карточек
 * «Продолжить просмотр». Заполняет родителя; размеры задаются через className.
 */
export function KageBackdrop({
  anime,
  rounded = 8,
  className,
  children,
}: {
  anime: Anime;
  rounded?: number;
  className?: string;
  children?: ReactNode;
}) {
  const [c1, c2, c3] = anime.palette;
  const aid = `${anime.id}-bd`;

  return (
    <div
      className={`relative size-full overflow-hidden ${className ?? ""}`}
      style={{ borderRadius: rounded }}
    >
      {anime.posterUrl ? (
        <Image
          src={anime.posterUrl}
          alt={anime.titleRu}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover"
        />
      ) : (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 block"
        >
          <defs>
            <linearGradient id={`bg-${aid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c2} />
              <stop offset="100%" stopColor={c1} />
            </linearGradient>
            <radialGradient id={`bglow-${aid}`} cx="0.3" cy="0.4" r="0.6">
              <stop offset="0%" stopColor={c3} stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="400" height="200" fill={`url(#bg-${aid})`} />
          <rect width="400" height="200" fill={`url(#bglow-${aid})`} />
          <g opacity="0.4">
            <path d="M-20 200 L420 -20" stroke={c3} strokeWidth="2" />
            <path d="M-20 180 L420 -40" stroke={c3} strokeWidth="0.8" />
          </g>
          <text
            x="395"
            y="25"
            fontFamily={KAGE_FONTS.jp}
            fontSize="40"
            fontWeight="900"
            fill={c3}
            opacity="0.18"
            textAnchor="end"
          >
            {anime.titleJp.slice(0, 4)}
          </text>
        </svg>
      )}
      {children}
    </div>
  );
}

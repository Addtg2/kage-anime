import type { CSSProperties } from "react";
import Image from "next/image";

import type { Anime } from "@/lib/anime/types";
import { KAGE_FONTS } from "./fonts";

const VARIANTS = [
  "orbit",
  "slash",
  "silhouette",
  "horizon",
  "ring",
  "rays",
  "wave",
  "grid",
] as const;

function pickVariant(id: string) {
  const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return VARIANTS[sum % VARIANTS.length];
}

/**
 * Стилизованный постер-плейсхолдер KAGE: уникальный градиент + ключевой визуал
 * по palette тайтла. Если есть реальный posterUrl — рисуем картинку с тем же
 * скримом и оверлеем названия. Чисто презентационный (server-friendly).
 */
export function KagePoster({
  anime,
  rounded = 12,
  showTitle = true,
  dense = false,
  className,
}: {
  anime: Anime;
  rounded?: number;
  showTitle?: boolean;
  dense?: boolean;
  className?: string;
}) {
  const [c1, c2, c3] = anime.palette;
  const aid = anime.id;
  const gradId = `g-${aid}`;
  const radId = `r-${aid}`;
  const scrimId = `scrim-${aid}`;
  const variant = pickVariant(aid);

  const containerStyle: CSSProperties = {
    borderRadius: rounded,
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
    // Браузеры с поддержкой View Transitions парят постер с hero
    // на детальной странице (тот же name = тот же морф).
    viewTransitionName: `poster-${anime.id}`,
  };

  const eyebrowStyle: CSSProperties = {
    color: c3,
    fontFamily: KAGE_FONTS.ui,
    fontSize: dense ? 10 : 11,
    fontWeight: 500,
    letterSpacing: "0.14em",
  };

  return (
    <div
      className={`relative isolate aspect-[2/3] w-full shrink-0 overflow-hidden ${className ?? ""}`}
      style={containerStyle}
    >
      {anime.posterUrl ? (
        <>
          <Image
            src={anime.posterUrl}
            alt={anime.titleRu}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 45%, ${c1}f2 100%)`,
            }}
          />
        </>
      ) : (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 300"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 block"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c2} stopOpacity="0.9" />
              <stop offset="55%" stopColor={c1} />
              <stop offset="100%" stopColor={c1} />
            </linearGradient>
            <radialGradient id={radId} cx="0.5" cy="0.35" r="0.65">
              <stop offset="0%" stopColor={c3} stopOpacity="0.45" />
              <stop offset="60%" stopColor={c2} stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id={scrimId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c1} stopOpacity="0" />
              <stop offset="100%" stopColor={c1} stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <rect width="200" height="300" fill={`url(#${gradId})`} />
          <rect width="200" height="300" fill={`url(#${radId})`} />

          {variant === "orbit" && (
            <g opacity="0.8">
              <circle cx="100" cy="110" r="48" fill="none" stroke={c3} strokeWidth="1.2" opacity="0.5" />
              <circle cx="100" cy="110" r="72" fill="none" stroke={c3} strokeWidth="0.8" opacity="0.3" />
              <circle cx="100" cy="110" r="32" fill={c3} opacity="0.95" />
              <circle cx="148" cy="110" r="6" fill={c2} />
            </g>
          )}
          {variant === "slash" && (
            <g>
              <path d="M-20 240 L240 -20" stroke={c3} strokeWidth="3" opacity="0.85" />
              <path d="M-20 220 L240 -40" stroke={c3} strokeWidth="1" opacity="0.5" />
              <path d="M-20 260 L240 0" stroke={c3} strokeWidth="1" opacity="0.5" />
              <circle cx="100" cy="130" r="40" fill={c2} opacity="0.7" />
            </g>
          )}
          {variant === "silhouette" && (
            <g opacity="0.92">
              <path d="M70 80 Q 100 50 130 80 Q 145 110 130 150 L130 220 L70 220 L70 150 Q 55 110 70 80 Z" fill={c3} opacity="0.9" />
              <circle cx="100" cy="95" r="22" fill={c1} opacity="0.5" />
            </g>
          )}
          {variant === "horizon" && (
            <g>
              <rect y="160" width="200" height="140" fill={c3} opacity="0.15" />
              <circle cx="100" cy="160" r="38" fill={c3} opacity="0.9" />
              <rect y="159" width="200" height="2" fill={c3} />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} y={170 + i * 22} width="200" height="1" fill={c3} opacity={0.4 - i * 0.07} />
              ))}
            </g>
          )}
          {variant === "ring" && (
            <g>
              <circle cx="100" cy="130" r="60" fill="none" stroke={c3} strokeWidth="4" opacity="0.95" />
              <circle cx="100" cy="130" r="60" fill="none" stroke={c2} strokeWidth="1" opacity="0.5" strokeDasharray="4 8" />
              <path d="M 100 70 L 100 190" stroke={c3} strokeWidth="2" opacity="0.6" />
            </g>
          )}
          {variant === "rays" && (
            <g opacity="0.85">
              {[0, 30, 60, 90, 120, 150].map((deg) => (
                <rect key={deg} x="99" y="-20" width="2" height="200" fill={c3} opacity="0.7" transform={`rotate(${deg} 100 130)`} />
              ))}
              <circle cx="100" cy="130" r="28" fill={c3} />
            </g>
          )}
          {variant === "wave" && (
            <g opacity="0.85">
              <path d="M0 150 Q 50 100, 100 150 T 200 150 L 200 220 L 0 220 Z" fill={c3} opacity="0.7" />
              <path d="M0 175 Q 50 125, 100 175 T 200 175" fill="none" stroke={c2} strokeWidth="2" opacity="0.5" />
              <circle cx="135" cy="95" r="15" fill={c3} />
            </g>
          )}
          {variant === "grid" && (
            <g opacity="0.7">
              <g stroke={c3} strokeWidth="0.6" opacity="0.5">
                {[40, 80, 120, 160].map((x) => (
                  <line key={"v" + x} x1={x} y1="0" x2={x} y2="300" />
                ))}
                {[60, 120, 180, 240].map((y) => (
                  <line key={"h" + y} x1="0" y1={y} x2="200" y2={y} />
                ))}
              </g>
              <rect x="60" y="80" width="80" height="100" fill={c3} opacity="0.85" />
              <rect x="60" y="80" width="80" height="100" fill="none" stroke={c2} strokeWidth="2" />
            </g>
          )}

          <rect y="180" width="200" height="120" fill={`url(#${scrimId})`} />

          <text
            x="178"
            y="34"
            fontFamily={KAGE_FONTS.jp}
            fontSize="18"
            fontWeight="900"
            fill={c3}
            opacity="0.42"
            style={{ writingMode: "vertical-rl", letterSpacing: "0.1em" }}
          >
            {anime.titleJp}
          </text>
        </svg>
      )}

      {showTitle && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 text-white"
          style={{ padding: dense ? "10px 12px" : "14px 14px 16px" }}
        >
          <div style={eyebrowStyle} className="mb-1 uppercase opacity-85">
            {anime.genres[0]} · {anime.year}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: dense ? 16 : 19,
              lineHeight: 1.05,
              color: "#fff",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {anime.titleRu}
          </div>
        </div>
      )}
    </div>
  );
}

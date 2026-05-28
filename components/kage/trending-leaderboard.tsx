import Link from "next/link";
import Image from "next/image";
import { Play, Star } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import { Rating } from "./rating";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Топ-10 недели. Лидер — полноширинная карточка с реальным постером слева
 * и плотной метой справа. Места 2–10 — компактная адаптивная сетка (1/2/3 кол.).
 */
export function TrendingLeaderboard({ items }: { items: Anime[] }) {
  if (items.length === 0) return null;
  const featured = items[0];
  const rest = items.slice(1, 10);

  return (
    <section className="px-[clamp(1rem,4vw,2.5rem)]">
      <div className="mb-5 sm:mb-7">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">
          <span className="h-px w-6 bg-brand" />
          Топ 10 на этой неделе
        </div>
        <h2 className="font-display text-foreground text-[clamp(1.5rem,2.6vw,2.25rem)]">
          В тренде
        </h2>
      </div>

      <FeaturedCard anime={featured} />

      <ol
        className="mt-4 grid gap-3 sm:mt-5 sm:gap-4"
        style={{
          // auto-fill: колонок столько, сколько влезет; каждая ≥ 280px
          // (или 100% контейнера, если контейнер уже 280px — этим избегаем
          // переполнения на очень узких экранах).
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
        }}
      >
        {rest.map((a, i) => (
          <LeaderRow key={a.id} anime={a} rank={i + 2} />
        ))}
      </ol>
    </section>
  );
}

function FeaturedCard({ anime }: { anime: Anime }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group relative block overflow-hidden rounded-3xl border border-border bg-bg-elev"
    >
      {/* тонкий halo от палитры тайтла */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 100% 0%, ${anime.palette[1]}, transparent 55%)`,
        }}
      />

      <div className="relative grid gap-[clamp(1rem,3vw,2.25rem)] p-[clamp(1rem,3vw,2rem)] grid-cols-[clamp(110px,17vw,260px)_minmax(0,1fr)]">
        {/* реальный постер тайтла */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/50">
          {anime.posterUrl ? (
            <Image
              src={anime.posterUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${anime.palette[0]}, ${anime.palette[1]})`,
              }}
            />
          )}
        </div>

        {/* мета */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-3 sm:gap-4">
            <span
              className="font-display shrink-0 leading-none text-brand text-[clamp(48px,9vw,130px)]"
              style={{
                letterSpacing: "-0.04em",
                filter: "drop-shadow(0 6px 28px rgba(255,46,99,0.35))",
              }}
            >
              01
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand sm:text-xs">
                Лидер недели
              </span>
              {anime.titleJp && (
                <span className="truncate font-jp text-xs text-text-dim sm:text-sm">
                  {anime.titleJp}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-display mt-[clamp(0.75rem,1.5vw,1.25rem)] leading-tight text-[clamp(1.35rem,3vw,2.75rem)]">
            {anime.titleRu}
          </h3>

          {anime.tagline && (
            <p className="mt-2 line-clamp-2 text-[13px] text-text-dim sm:mt-3 sm:line-clamp-3 sm:text-sm lg:text-base lg:leading-relaxed">
              {anime.tagline}
            </p>
          )}

          <div className="mt-auto pt-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-dim sm:gap-x-3 sm:text-xs">
              {anime.rating > 0 && <Rating value={anime.rating} />}
              {anime.year > 0 && (
                <>
                  <Dot />
                  <span>{anime.year}</span>
                </>
              )}
              {anime.eps > 0 && (
                <>
                  <Dot />
                  <span>{anime.eps} эп.</span>
                </>
              )}
              {anime.age && (
                <>
                  <Dot />
                  <span>{anime.age}</span>
                </>
              )}
              {anime.genres[0] && (
                <>
                  <Dot />
                  <span className="hidden truncate sm:inline">
                    {anime.genres.slice(0, 2).join(", ")}
                  </span>
                </>
              )}
            </div>
            <span
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "inline-flex",
              )}
            >
              <Play fill="currentColor" strokeWidth={0} />
              Смотреть
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LeaderRow({ anime, rank }: { anime: Anime; rank: number }) {
  return (
    <li>
      <Link
        href={`/anime/${anime.id}`}
        className="group flex items-center gap-3 rounded-2xl border border-border bg-bg-elev p-3 transition-colors hover:border-border-hi hover:bg-surface sm:gap-4"
      >
        <span
          className="font-display w-[36px] shrink-0 text-right text-[30px] leading-none text-brand sm:w-[44px] sm:text-[36px]"
          style={{ letterSpacing: "-0.03em" }}
        >
          {String(rank).padStart(2, "0")}
        </span>
        <div className="relative h-[72px] w-[50px] shrink-0 overflow-hidden rounded-md bg-surface sm:h-[84px] sm:w-[58px]">
          {anime.posterUrl ? (
            <Image
              src={anime.posterUrl}
              alt=""
              fill
              sizes="60px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${anime.palette[0]}, ${anime.palette[1]})`,
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[15px] leading-tight text-foreground sm:text-base">
            {anime.titleRu}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-dim">
            {anime.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star
                  className="size-3 text-star"
                  fill="currentColor"
                  strokeWidth={0}
                />
                {anime.rating.toFixed(1)}
              </span>
            )}
            {anime.year > 0 && (
              <>
                {anime.rating > 0 && <Dot />}
                <span>{anime.year}</span>
              </>
            )}
            {anime.genres[0] && (
              <>
                <Dot />
                <span className="truncate">{anime.genres[0]}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-text-dim" />;
}

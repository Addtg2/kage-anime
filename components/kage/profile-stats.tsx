"use client";

import { Clock, Film, Sparkles } from "lucide-react";

import { useProfileStats } from "@/lib/db/hooks";

/**
 * Секция «Статистика» на странице профиля (G3).
 * Источник — Dexie history. SVG bar chart рисуется без зависимостей.
 */
export function ProfileStats() {
  const stats = useProfileStats();

  if (!stats || stats.totalAnime === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface/50 p-4 text-sm text-text-dim">
        Статистика появится, когда вы посмотрите первые серии.
      </p>
    );
  }

  const maxMonthly = Math.max(1, ...stats.monthly.map((m) => m.count));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile
          icon={<Clock className="size-4 text-brand" />}
          label="Часов"
          value={stats.hoursWatched}
        />
        <Tile
          icon={<Film className="size-4 text-brand" />}
          label="Серий"
          value={stats.totalEpisodes}
        />
        <Tile
          icon={<Sparkles className="size-4 text-brand" />}
          label="Тайтлов"
          value={stats.totalAnime}
        />
      </div>

      {stats.topGenres.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-text-dim">
            Любимые жанры
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topGenres.map((g, i) => (
              <span
                key={g.name}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs"
              >
                <span className="text-text-dim">#{i + 1}</span>{" "}
                <span className="text-foreground">{g.name}</span>{" "}
                <span className="text-text-mute">· {g.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.15em] text-text-dim">
          Активность за 6 месяцев
        </div>
        <svg viewBox="0 0 240 80" className="h-20 w-full">
          {stats.monthly.map((m, i) => {
            const x = i * 40 + 6;
            const h = (m.count / maxMonthly) * 60;
            const y = 70 - h;
            return (
              <g key={m.label}>
                <rect
                  x={x}
                  y={y}
                  width={28}
                  height={h || 1}
                  rx={2}
                  fill="var(--brand)"
                  opacity={m.count > 0 ? 0.9 : 0.25}
                />
                <text
                  x={x + 14}
                  y={78}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="fill-text-dim"
                >
                  {m.label}
                </text>
                {m.count > 0 && (
                  <text
                    x={x + 14}
                    y={y - 2}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-foreground"
                  >
                    {m.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-text-dim">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-2xl text-foreground">{value}</div>
    </div>
  );
}

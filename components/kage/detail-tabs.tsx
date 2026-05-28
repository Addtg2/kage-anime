"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import { cn } from "@/lib/utils";
import { KageBackdrop } from "./backdrop";
import { KagePoster } from "./poster";

interface Ep {
  num: number;
  title: string;
  duration: number;
}

type TabId = "episodes" | "about" | "similar";

export function DetailTabs({
  anime,
  episodes,
  similar,
}: {
  anime: Anime;
  episodes: Ep[];
  similar: Anime[];
}) {
  const [tab, setTab] = useState<TabId>("episodes");

  const tabs: { id: TabId; label: string }[] = [
    { id: "episodes", label: `Эпизоды${anime.eps ? ` (${anime.eps})` : ""}` },
    { id: "about", label: "Описание" },
    { id: "similar", label: "Похожее" },
  ];

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-[clamp(1rem,4vw,3.5rem)] sm:gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-4 text-[13px] transition-colors sm:px-4",
              tab === t.id
                ? "border-brand font-semibold text-foreground"
                : "border-transparent font-medium text-text-dim hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-[clamp(1rem,4vw,3.5rem)] py-[clamp(1.5rem,2.5vw,2rem)]">
        {tab === "episodes" && <Episodes anime={anime} episodes={episodes} />}
        {tab === "about" && <About anime={anime} />}
        {tab === "similar" && <Similar items={similar} />}
      </div>
    </div>
  );
}

function Episodes({ anime, episodes }: { anime: Anime; episodes: Ep[] }) {
  if (episodes.length === 0) {
    return (
      <p className="text-sm text-text-dim">
        Список эпизодов появится после старта показа.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {episodes.map((ep) => (
        <Link
          key={ep.num}
          href={`/anime/${anime.id}/watch?ep=${ep.num}`}
          className="group grid items-center border-b border-border py-3.5 text-left gap-[clamp(0.875rem,2vw,1.5rem)] grid-cols-[clamp(110px,16vw,200px)_minmax(0,1fr)_auto]"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <KageBackdrop anime={{ ...anime, posterUrl: undefined }} rounded={6}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50" />
              <div className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0a0a0f] transition-transform group-hover:scale-110">
                <Play className="size-3.5" fill="currentColor" strokeWidth={0} />
              </div>
              <span className="absolute bottom-1 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {ep.duration} мин
              </span>
            </KageBackdrop>
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-text-dim">
              Эпизод {String(ep.num).padStart(2, "0")}
            </div>
            <div className="font-display leading-tight text-[clamp(0.95rem,1.7vw,1.2rem)]">
              {ep.title}
            </div>
          </div>
          <ChevronRight className="size-[18px] text-text-dim" />
        </Link>
      ))}
    </div>
  );
}

function About({ anime }: { anime: Anime }) {
  return (
    <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-text-dim sm:text-base">
      {anime.synopsis ? (
        <p>{anime.synopsis}</p>
      ) : (
        <p>Описание для этого тайтла пока недоступно.</p>
      )}
      {anime.studio && (
        <p>
          Студия{" "}
          <span className="text-foreground">{anime.studio}</span>. Доступно на
          KAGE в оригинальной озвучке с русскими субтитрами.
        </p>
      )}
      {anime.genres.length > 0 && (
        <p>
          Возрастная маркировка:{" "}
          <strong className="text-foreground">{anime.age || "—"}</strong>.
          Жанры: {anime.genres.join(", ")}.
        </p>
      )}
    </div>
  );
}

function Similar({ items }: { items: Anime[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-dim">Похожих тайтлов не нашлось.</p>;
  }
  return (
    <div
      className="grid gap-3 sm:gap-4"
      style={{
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(50% - 0.375rem, 160px), 1fr))",
      }}
    >
      {items.map((a) => (
        <Link
          key={a.id}
          href={`/anime/${a.id}`}
          className="transition-transform hover:-translate-y-1"
        >
          <KagePoster anime={a} dense />
        </Link>
      ))}
    </div>
  );
}

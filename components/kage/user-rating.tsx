"use client";

import { useLibraryStore } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils";

interface Props {
  animeId: string;
  shikiRating?: number;
}

export function UserRating({ animeId, shikiRating }: Props) {
  const hydrated = useHydrated();
  const entry = useLibraryStore((s) => s.entries[animeId]);
  const setRating = useLibraryStore((s) => s.setRating);

  if (!hydrated || !entry) return null;

  const current = entry.userRating;

  return (
    <div className="mt-2">
      {current != null && shikiRating != null && shikiRating > 0 && (
        <p className="mb-1.5 text-[11px] text-text-dim">
          твоя: <span className="font-semibold text-brand">{current}</span>
          {" · shiki: "}
          <span className="font-semibold text-foreground">{shikiRating.toFixed(1)}</span>
        </p>
      )}
      {current == null && shikiRating != null && shikiRating > 0 && (
        <p className="mb-1.5 text-[11px] text-text-mute">
          shiki: {shikiRating.toFixed(1)} · оцените:
        </p>
      )}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Оценка ${n}`}
            aria-pressed={n === current}
            onClick={() => setRating(animeId, current === n ? undefined : n)}
            className={cn(
              "h-6 w-6 rounded text-[11px] font-semibold transition-colors",
              n === current
                ? "bg-brand text-white"
                : "bg-surface text-text-dim hover:bg-brand/20 hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

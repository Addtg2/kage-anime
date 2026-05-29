"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

import { useSettingsStore } from "@/lib/store/settings";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils";

export function SpoilerSynopsis({ synopsis }: { synopsis: string }) {
  const hydrated = useHydrated();
  const spoilerFree = useSettingsStore((s) => s.spoilerFree);
  const [revealed, setRevealed] = useState(false);

  const blur = hydrated && spoilerFree && !revealed;

  return (
    <div className="relative">
      <p
        className={cn(
          "max-w-3xl text-sm leading-relaxed text-text-dim transition-[filter] sm:text-base",
          blur && "select-none blur-sm",
        )}
      >
        {synopsis}
      </p>
      {blur && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/90 px-4 py-2 text-sm font-medium text-foreground shadow backdrop-blur-sm">
            <Eye className="size-4" />
            Показать синопсис
          </span>
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { MonitorPlay } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PlayerTab {
  id: "kodik" | "alloha";
  label: string;
  available: boolean;
  src?: string;
}

export function PlayerSwitcher({ tabs }: { tabs: PlayerTab[] }) {
  const initial = tabs.find((t) => t.available)?.id ?? tabs[0]?.id;
  const [active, setActive] = useState(initial);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.available}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
              active === t.id && t.available
                ? "border-brand bg-brand text-white"
                : t.available
                  ? "border-border bg-surface-2 text-text-dim hover:text-foreground"
                  : "cursor-not-allowed border-border bg-surface text-text-mute",
            )}
          >
            {t.label}
            {!t.available && " · недоступно"}
          </button>
        ))}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {current?.available && current.src ? (
          <iframe
            key={current.id}
            src={current.src}
            title={`Плеер ${current.label}`}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <UnavailableState />
        )}
      </div>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <MonitorPlay className="size-10 text-text-mute" />
      <p className="font-display text-xl text-foreground">Источник недоступен</p>
      <p className="max-w-md text-sm text-text-dim">
        Для этого тайтла нет видео в выбранном плеере — попробуйте другую вкладку.
        Alloha требует токен{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand-2">ALLOHA_TOKEN</code>{" "}
        в <code className="rounded bg-surface-2 px-1.5 py-0.5">.env.local</code>.
      </p>
    </div>
  );
}

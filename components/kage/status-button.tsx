"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import {
  LIBRARY_STATUSES,
  useLibraryStore,
  type LibraryStatus,
} from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Size = "md" | "lg";

/**
 * Кнопка «В список» с дропдауном статусов. Если тайтл уже в списке —
 * показывает текущий статус и опцию «Убрать». Сохраняет в zustand+localStorage.
 */
export function StatusButton({
  anime,
  size = "lg",
}: {
  anime: Anime;
  size?: Size;
}) {
  const hydrated = useHydrated();
  const status = useLibraryStore((s) => s.entries[anime.id]?.status ?? null);
  const setStatus = useLibraryStore((s) => s.setStatus);
  const remove = useLibraryStore((s) => s.remove);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLabel =
    hydrated && status
      ? LIBRARY_STATUSES.find((s) => s.id === status)?.label
      : null;

  const inList = hydrated && !!status;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: inList ? "primary" : "glass", size }),
        )}
      >
        {inList ? <Check /> : <Plus />}
        {currentLabel ?? "В список"}
        <ChevronDown
          className={cn(
            "transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-2xl shadow-black/40"
        >
          {LIBRARY_STATUSES.map((s) => {
            const active = status === s.id;
            const Status = (props: { onSelect: (id: LibraryStatus) => void }) => (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  props.onSelect(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface",
                  active ? "text-brand" : "text-foreground",
                )}
              >
                {active ? (
                  <Check className="size-4" />
                ) : (
                  <span className="size-4" />
                )}
                {s.label}
              </button>
            );
            return <Status key={s.id} onSelect={(id) => setStatus(anime, id)} />;
          })}

          {inList && (
            <>
              <div className="h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  remove(anime.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-dim transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="size-4" />
                Убрать из списка
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

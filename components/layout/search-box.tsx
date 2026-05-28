"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { CommandPalette } from "@/components/kage/command-palette";

/**
 * Компактный триггер в хедере — открывает CommandPalette (⌘K).
 * Сам поиск/группы/действия живут в палете.
 */
export function SearchBox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Поиск (⌘K)"
        className="group flex h-9 w-full max-w-xs items-center gap-2 rounded-full border border-border bg-surface-2 px-3.5 text-[13px] text-text-dim transition-colors hover:border-border-hi hover:text-foreground sm:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Поиск аниме…</span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-surface px-1 font-mono text-[10px] text-text-mute">
            ⌘
          </kbd>
          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-surface px-1 font-mono text-[10px] text-text-mute">
            K
          </kbd>
        </span>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

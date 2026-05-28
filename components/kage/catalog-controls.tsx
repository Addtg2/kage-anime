"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const GENRES = [
  { id: "", label: "Все жанры" },
  { id: "1", label: "Экшен" },
  { id: "2", label: "Приключения" },
  { id: "4", label: "Комедия" },
  { id: "8", label: "Драма" },
  { id: "10", label: "Фэнтези" },
  { id: "7", label: "Тайна" },
  { id: "22", label: "Романтика" },
  { id: "24", label: "Сай-фай" },
  { id: "37", label: "Сверхъестественное" },
  { id: "36", label: "Повседневность" },
  { id: "30", label: "Спорт" },
];

export const SORTS = [
  { id: "popularity", label: "В тренде" },
  { id: "ranked", label: "По рейтингу" },
  { id: "aired_on", label: "Новинки" },
  { id: "name", label: "По алфавиту" },
];

export function CatalogControls() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const genre = sp.get("genre") ?? "";
  const order = sp.get("order") ?? "popularity";
  const currentSearch = sp.get("search") ?? "";
  const [q, setQ] = useState(currentSearch);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // сбрасываем пагинацию при смене фильтра
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // дебаунс поискового ввода (350мс) — щадим rate-limit Shikimori
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== currentSearch) setParam("search", q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-5">
      <div className="flex h-12 items-center gap-2.5 rounded-full border border-border-hi bg-surface px-4">
        <Search className="size-5 shrink-0 text-text-dim" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Название, жанр, студия…"
          className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-text-dim sm:text-base"
          aria-label="Поиск по каталогу"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Очистить"
            className="text-text-dim transition-colors hover:text-foreground"
          >
            <X className="size-[18px]" />
          </button>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {GENRES.map((g) => (
          <button
            key={g.id || "all"}
            type="button"
            onClick={() => setParam("genre", g.id)}
            className={cn(
              "h-7 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
              genre === g.id
                ? "border-foreground bg-foreground text-background"
                : "border-border text-text-dim hover:text-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setParam("order", s.id)}
            className={cn(
              "border-b-[1.5px] px-3 py-2 text-xs transition-colors",
              order === s.id
                ? "border-brand font-semibold text-foreground"
                : "border-transparent font-medium text-text-dim hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

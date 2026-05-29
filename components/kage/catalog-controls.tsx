"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Drawer } from "vaul";

import { cn } from "@/lib/utils";

export const GENRES = [
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
  { id: "14", label: "Ужасы" },
  { id: "18", label: "Меха" },
  { id: "62", label: "Исэкай" },
  { id: "23", label: "Школа" },
];

export const KINDS = [
  { id: "", label: "Все типы" },
  { id: "tv", label: "TV-сериал" },
  { id: "movie", label: "Фильм" },
  { id: "ova", label: "OVA" },
  { id: "ona", label: "ONA" },
  { id: "special", label: "Спецвыпуск" },
];

export const STATUSES = [
  { id: "", label: "Любой статус" },
  { id: "ongoing", label: "Выходит" },
  { id: "released", label: "Завершён" },
  { id: "anons", label: "Анонсирован" },
];

export const SORTS = [
  { id: "popularity", label: "В тренде" },
  { id: "ranked", label: "По рейтингу" },
  { id: "aired_on", label: "Новинки" },
  { id: "name", label: "По алфавиту" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1959 }, (_, i) => CURRENT_YEAR - i);

const SEASONS = [
  { id: "", label: "Любой сезон" },
  { id: "winter", label: "Зима" },
  { id: "spring", label: "Весна" },
  { id: "summer", label: "Лето" },
  { id: "fall", label: "Осень" },
];

const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const selectCls =
  "h-9 cursor-pointer appearance-none rounded-full border border-border bg-surface px-3 pr-8 text-xs text-foreground transition-colors hover:border-border-hi focus:outline-none";

const selectStyle = {
  backgroundImage: CHEVRON_BG,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "calc(100% - 10px) center",
};

export function CatalogControls() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const genresParam = sp.get("genres") ?? sp.get("genre") ?? "";
  const activeGenres = genresParam ? genresParam.split(",").filter(Boolean) : [];
  const kind = sp.get("kind") ?? "";
  const status = sp.get("status") ?? "";
  const year = sp.get("year") ?? "";
  const season = sp.get("season") ?? "";
  const order = sp.get("order") ?? "popularity";
  const currentSearch = sp.get("search") ?? "";
  const [q, setQ] = useState(currentSearch);

  const hasFilters =
    activeGenres.length > 0 || !!kind || !!status || !!year || !!season || !!currentSearch;

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.delete("genre");
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`));
  }

  function toggleGenre(id: string) {
    const next = activeGenres.includes(id)
      ? activeGenres.filter((g) => g !== id)
      : [...activeGenres, id];
    push({ genres: next.join(",") });
  }

  function reset() {
    setQ("");
    startTransition(() => router.replace(pathname));
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== currentSearch) push({ search: q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const renderPanel = (inDrawer: boolean) => (
    <div className="space-y-4">
      <div>
        {inDrawer && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
            Жанры
          </div>
        )}
        <div className={cn("flex flex-wrap gap-2", inDrawer && "max-h-[40vh] overflow-y-auto")}>
          {GENRES.map((g) => {
            const active = activeGenres.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
                  active
                    ? "border-brand bg-brand/15 text-brand"
                    : "border-border text-text-dim hover:text-foreground",
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <fieldset className="m-0 grid grid-cols-2 gap-2 border-0 p-0 sm:flex sm:flex-wrap sm:items-center">
        <legend className="sr-only">Дополнительные фильтры</legend>
        <select
          value={kind}
          onChange={(e) => push({ kind: e.target.value })}
          aria-label="Тип"
          className={selectCls}
          style={selectStyle}
        >
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => push({ status: e.target.value })}
          aria-label="Статус"
          className={selectCls}
          style={selectStyle}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={season}
          onChange={(e) => push({ season: e.target.value })}
          aria-label="Сезон"
          className={selectCls}
          style={selectStyle}
        >
          {SEASONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => push({ year: e.target.value })}
          aria-label="Год выхода"
          className={selectCls}
          style={selectStyle}
        >
          <option value="">Все годы</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-xs text-text-dim transition-colors hover:border-foreground hover:text-foreground sm:col-auto"
          >
            <X className="size-3.5" />
            Сбросить
          </button>
        )}
      </fieldset>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search + mobile filter toggle */}
      <div className="flex gap-2">
        <div className="flex h-12 flex-1 items-center gap-2.5 rounded-full border border-border-hi bg-surface px-4">
          <Search className="size-5 shrink-0 text-text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Название, жанр, студия…"
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-text-dim sm:text-base"
            aria-label="Поиск по каталогу"
          />
          {isPending ? (
            <Loader2 className="size-[18px] shrink-0 animate-spin text-text-dim" aria-hidden />
          ) : q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Очистить"
              className="text-text-dim transition-colors hover:text-foreground"
            >
              <X className="size-[18px]" />
            </button>
          ) : null}
        </div>

        <Drawer.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Drawer.Trigger asChild>
            <button
              type="button"
              aria-label="Фильтры"
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors sm:hidden",
                hasFilters && !currentSearch
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-dim hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="size-5" />
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border border-border bg-surface outline-none">
              <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" />
              <div className="flex items-center justify-between px-4 pb-2 pt-3">
                <Drawer.Title className="text-base font-semibold">Фильтры</Drawer.Title>
                <Drawer.Close asChild>
                  <button
                    type="button"
                    aria-label="Закрыть"
                    className="flex size-8 items-center justify-center rounded-full text-text-dim transition-colors hover:text-foreground"
                  >
                    <X className="size-5" />
                  </button>
                </Drawer.Close>
              </div>
              <Drawer.Description className="sr-only">
                Жанры, тип, статус, сезон и год выхода
              </Drawer.Description>
              <div className="flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                {renderPanel(true)}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* Desktop inline panel */}
      <div className="hidden sm:block">{renderPanel(false)}</div>

      {/* Sort tabs */}
      <div className="flex items-center justify-end gap-1">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => push({ order: s.id })}
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

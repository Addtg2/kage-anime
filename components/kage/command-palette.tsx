"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bookmark,
  Compass,
  Flame,
  History,
  Loader2,
  Play,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLibraryStore } from "@/lib/store/library";
import { useResume } from "@/lib/db/hooks";
import { clearHistory } from "@/lib/db/dexie";
import { cn } from "@/lib/utils";

interface RemoteHit {
  id: string;
  titleRu: string;
  titleJp: string;
  year: number;
  rating: number;
  posterUrl: string | null;
}

/**
 * KAGE Command Palette — открывается по ⌘K / Ctrl+K и через триггер в хедере.
 * Группы: «Из вашего списка», «Недавнее», «Тайтлы» (Shikimori live),
 * «Быстрые действия». Поверх cmdk (by Vercel) — fuzzy скоринг встроен.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<RemoteHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const entries = useLibraryStore((s) => s.entries);
  const resume = useResume(8);

  // Дебаунс + AbortController. Старая дропдаунка SearchBox делала то же самое.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRemote([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = (await r.json()) as { items: RemoteHit[] };
        setRemote(data.items ?? []);
      } catch {
        /* abort / network */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  // Сбрасываем поиск при закрытии и возвращаем фокус в инпут при открытии.
  useEffect(() => {
    if (!open) {
      setQ("");
      setRemote([]);
    } else {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc — закрыть, ⌘K — переключить
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const fromLibrary = useMemo(() => {
    return Object.values(entries)
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, 6);
  }, [entries]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const go = useCallback(
    (path: string) => {
      close();
      router.push(path);
    },
    [close, router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Поиск"
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-2xl shadow-black/60">
        <Command
          loop
          shouldFilter
          filter={(value, search) => {
            // Свои items (статика — действия, библиотека, недавнее) — fuzzy
            // через cmdk; remote-результаты Shikimori не фильтруем повторно.
            if (value.startsWith("remote:")) return 1;
            const v = value.toLowerCase();
            const s = search.toLowerCase();
            return v.includes(s) ? 1 : 0;
          }}
        >
          <div className="flex items-center">
            <CommandInput
              ref={inputRef}
              value={q}
              onValueChange={setQ}
              placeholder="Поиск тайтла или действия…"
            />
            <button
              type="button"
              aria-label="Закрыть"
              onClick={close}
              className="mr-3 inline-flex size-7 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-foreground"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
            </button>
          </div>

          <CommandList>
            <CommandEmpty>
              {q.trim().length < 2
                ? "Начните вводить — ⌘K закрывает"
                : loading
                  ? "Ищем…"
                  : "Ничего не нашлось"}
            </CommandEmpty>

            {q.trim().length === 0 && fromLibrary.length > 0 && (
              <CommandGroup heading="Из вашего списка">
                {fromLibrary.map(({ anime }) => (
                  <CommandItem
                    key={`lib-${anime.id}`}
                    value={`lib ${anime.titleRu} ${anime.titleJp}`}
                    onSelect={() => go(`/anime/${anime.id}`)}
                  >
                    <Thumb url={anime.posterUrl ?? null} />
                    <Meta a={anime} kind={<Bookmark className="size-3" />} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {q.trim().length === 0 && resume && resume.length > 0 && (
              <CommandGroup heading="Недавно смотрели">
                {resume.map(({ anime, episode }) => (
                  <CommandItem
                    key={`his-${anime.id}`}
                    value={`his ${anime.titleRu}`}
                    onSelect={() =>
                      go(`/anime/${anime.id}/watch?ep=${episode}`)
                    }
                  >
                    <Thumb url={anime.posterUrl ?? null} />
                    <Meta
                      a={anime}
                      kind={
                        <span className="inline-flex items-center gap-1">
                          <Play
                            className="size-3"
                            fill="currentColor"
                            strokeWidth={0}
                          />
                          Эп. {episode}
                        </span>
                      }
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {remote.length > 0 && (
              <CommandGroup heading="Тайтлы">
                {remote.map((r) => (
                  <CommandItem
                    key={`rem-${r.id}`}
                    value={`remote:${r.id}`}
                    onSelect={() => go(`/anime/${r.id}`)}
                  >
                    <Thumb url={r.posterUrl} />
                    <Meta
                      a={{
                        titleRu: r.titleRu,
                        titleJp: r.titleJp,
                        year: r.year,
                        rating: r.rating,
                      }}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Быстрые действия">
              <CommandItem
                value="action catalog"
                onSelect={() => go("/catalog")}
              >
                <ActionIcon>
                  <Compass className="size-4" />
                </ActionIcon>
                <span className="flex-1">Открыть каталог</span>
                <Kbd>G C</Kbd>
              </CommandItem>
              <CommandItem
                value="action new"
                onSelect={() => go("/catalog?order=aired_on")}
              >
                <ActionIcon>
                  <Sparkles className="size-4" />
                </ActionIcon>
                <span className="flex-1">Новинки сезона</span>
              </CommandItem>
              <CommandItem
                value="action top"
                onSelect={() => go("/catalog?order=ranked")}
              >
                <ActionIcon>
                  <Flame className="size-4" />
                </ActionIcon>
                <span className="flex-1">Топ всех времён</span>
              </CommandItem>
              <CommandItem
                value="action mylist"
                onSelect={() => go("/mylist")}
              >
                <ActionIcon>
                  <Bookmark className="size-4" />
                </ActionIcon>
                <span className="flex-1">Открыть «Моё»</span>
              </CommandItem>
              {q.trim().length >= 2 && (
                <CommandItem
                  value="action catalog-search"
                  onSelect={() =>
                    go(`/catalog?search=${encodeURIComponent(q.trim())}`)
                  }
                >
                  <ActionIcon>
                    <Compass className="size-4" />
                  </ActionIcon>
                  <span className="flex-1">
                    Искать «{q.trim()}» в каталоге
                  </span>
                </CommandItem>
              )}
              {resume && resume.length > 0 && (
                <CommandItem
                  value="action clear-history"
                  onSelect={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.confirm("Очистить историю просмотров?")
                    ) {
                      clearHistory();
                      close();
                    }
                  }}
                >
                  <ActionIcon>
                    <Trash2 className="size-4" />
                  </ActionIcon>
                  <span className="flex-1">Очистить историю</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-text-mute">
            <span>
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> навигация
            </span>
            <span>
              <Kbd>Esc</Kbd> закрыть
            </span>
            <span>
              <Kbd>Enter</Kbd> выбрать
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="relative h-[42px] w-[30px] shrink-0 rounded bg-surface" />
    );
  }
  return (
    <div className="relative h-[42px] w-[30px] shrink-0 overflow-hidden rounded bg-surface">
      <Image src={url} alt="" fill sizes="30px" className="object-cover" />
    </div>
  );
}

function Meta({
  a,
  kind,
}: {
  a: { titleRu: string; titleJp?: string; year: number; rating: number };
  kind?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="truncate font-display text-[14px] leading-snug text-foreground">
        {a.titleRu}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-dim">
        {a.rating > 0 && (
          <span className="inline-flex items-center gap-0.5 text-foreground">
            <Star
              className="size-3 text-star"
              fill="currentColor"
              strokeWidth={0}
            />
            {a.rating.toFixed(1)}
          </span>
        )}
        {a.year > 0 && <span>{a.year}</span>}
        {a.titleJp && (
          <span className="truncate font-jp text-text-mute">{a.titleJp}</span>
        )}
        {kind && <span className="ml-auto text-text-mute">{kind}</span>}
      </div>
    </div>
  );
}

function ActionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-dim">
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-surface px-1 font-mono text-[10px] text-text-dim",
      )}
    >
      {children}
    </kbd>
  );
}

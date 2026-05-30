"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Drawer } from "vaul";
import { Bookmark, Loader2, Play, Star, X } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLibraryStore } from "@/lib/store/library";
import { useResume } from "@/lib/db/hooks";

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
 * Группы: «Из вашего списка», «Недавно смотрели», «Тайтлы» (Shikimori live).
 * Поверх cmdk (by Vercel) — fuzzy скоринг встроен.
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  const body = (
    <>
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
                      go(`/anime/${anime.id}?ep=${episode}#player`)
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
          </CommandList>

        </Command>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
          <Drawer.Content
            aria-label="Поиск"
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-bg-elev shadow-2xl shadow-black/60 outline-none"
          >
            <Drawer.Title className="sr-only">Поиск</Drawer.Title>
            <Drawer.Description className="sr-only">
              Поиск тайтлов
            </Drawer.Description>
            <div
              aria-hidden
              className="mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-border"
            />
            {body}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

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
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-2xl shadow-black/60">
        {body}
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
      {a.titleJp && (
        <div className="truncate font-jp text-[11px] leading-snug text-text-mute">
          {a.titleJp}
        </div>
      )}
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
        {kind && <span className="ml-auto text-text-mute">{kind}</span>}
      </div>
    </div>
  );
}


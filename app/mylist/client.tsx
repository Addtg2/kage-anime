"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Pencil, X, Check } from "lucide-react";

import { KagePoster } from "@/components/kage/poster";
import { Rating } from "@/components/kage/rating";
import { UserRating } from "@/components/kage/user-rating";
import {
  LIBRARY_STATUSES,
  useLibraryStore,
  type LibraryEntry,
  type LibraryStatus,
} from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils";

const NOTE_MAX = 280;

export function MyListClient() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<LibraryStatus>("watching");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  const entries = useLibraryStore((s) => s.entries);
  const setNote = useLibraryStore((s) => s.setNote);

  const counts = useMemo(() => {
    const acc: Record<LibraryStatus, number> = {
      watching: 0,
      planned: 0,
      completed: 0,
      dropped: 0,
    };
    if (!hydrated) return acc;
    for (const e of Object.values(entries)) acc[e.status] += 1;
    return acc;
  }, [entries, hydrated]);

  const list = useMemo(() => {
    if (!hydrated) return [];
    return Object.values(entries)
      .filter((e) => e.status === tab)
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [entries, tab, hydrated]);

  function startEdit(entry: LibraryEntry) {
    setEditingNoteId(entry.anime.id);
    setNoteValue(entry.note ?? "");
  }

  function saveNote(animeId: string) {
    setNote(animeId, noteValue.trim());
    setEditingNoteId(null);
  }

  function cancelEdit() {
    setEditingNoteId(null);
  }

  return (
    <div className="mx-auto max-w-[1600px] py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
      <h1 className="font-display mb-6 text-[clamp(2rem,4.5vw,3.5rem)]">Моё</h1>

      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border sm:gap-2">
        {LIBRARY_STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setTab(s.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-[13px] transition-colors sm:px-4",
              tab === s.id
                ? "border-brand font-semibold text-foreground"
                : "border-transparent font-medium text-text-dim hover:text-foreground",
            )}
          >
            {s.label}
            <span
              className={cn(
                "ml-1.5 text-[11px]",
                tab === s.id ? "text-brand" : "text-text-mute",
              )}
            >
              {counts[s.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {!hydrated ? (
          <EmptyState label="Загружаем ваш список…" />
        ) : list.length === 0 ? (
          <EmptyState
            label={
              tab === "watching"
                ? "Здесь будут тайтлы, которые вы смотрите сейчас."
                : tab === "planned"
                  ? "Соберите коллекцию, которую хотите посмотреть."
                  : tab === "completed"
                    ? "Сюда попадут просмотренные тайтлы."
                    : "Брошенные тайтлы появятся здесь."
            }
            cta
          />
        ) : (
          <div
            className="grid gap-3 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(50% - 0.375rem, 170px), 1fr))",
            }}
          >
            {list.map((entry) => {
              const { anime } = entry;
              const isEditingNote = editingNoteId === anime.id;

              return (
                <div key={anime.id} className="group flex flex-col">
                  <Link
                    href={`/anime/${anime.id}`}
                    className="block transition-transform group-hover:-translate-y-0.5"
                  >
                    <KagePoster anime={anime} dense />
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-text-dim">
                      {anime.rating > 0 && <Rating value={anime.rating} size={11} />}
                      {anime.year > 0 && (
                        <>
                          <span>·</span>
                          <span>{anime.year}</span>
                        </>
                      )}
                    </div>
                  </Link>

                  {/* User rating picker */}
                  <UserRating animeId={anime.id} />

                  {/* Note section */}
                  <div className="mt-2">
                    {isEditingNote ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          autoFocus
                          value={noteValue}
                          maxLength={NOTE_MAX}
                          rows={3}
                          onChange={(e) => setNoteValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveNote(anime.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full resize-none rounded border border-border bg-surface px-2 py-1.5 text-[11px] text-foreground placeholder:text-text-mute focus:border-brand focus:outline-none"
                          placeholder="Заметка…"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-mute">
                            {noteValue.length}/{NOTE_MAX}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              aria-label="Отмена"
                              className="rounded p-0.5 text-text-mute hover:text-foreground"
                            >
                              <X className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => saveNote(anime.id)}
                              aria-label="Сохранить"
                              className="rounded p-0.5 text-brand hover:text-brand/80"
                            >
                              <Check className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1">
                        {entry.note ? (
                          <p className="flex-1 text-[11px] leading-relaxed text-text-dim line-clamp-2">
                            {entry.note}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          aria-label="Редактировать заметку"
                          className={cn(
                            "ml-auto rounded p-0.5 text-text-mute transition-opacity hover:text-foreground",
                            entry.note ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <Pencil className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label, cta }: { label: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-surface text-text-dim">
        <Bookmark className="size-6" />
      </div>
      <p className="max-w-md text-sm text-text-dim">{label}</p>
      {cta && (
        <Link
          href="/catalog"
          className="rounded-full border border-border-hi px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          В каталог
        </Link>
      )}
    </div>
  );
}

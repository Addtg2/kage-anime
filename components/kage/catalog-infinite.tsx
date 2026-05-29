"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Anime } from "@/lib/anime/types";
import { KagePoster } from "./poster";
import { Rating } from "./rating";

interface Props {
  initialItems: Anime[];
  initialHasMore: boolean;
}

// Уникальный ключ фильтров — без page, чтобы сохранять scroll/state по
// одинаковой выдаче независимо от того, на какой странице её перезагрузили.
function buildFilterKey(sp: URLSearchParams): string {
  const params = new URLSearchParams();
  const keys = ["genres", "genre", "tag", "kind", "status", "year", "season", "order", "search"];
  for (const k of keys) {
    const v = sp.get(k);
    if (v) params.set(k, v);
  }
  return params.toString();
}

interface PersistedState {
  items: Anime[];
  page: number;
  hasMore: boolean;
  scrollY: number;
}

export function CatalogInfinite({ initialItems, initialHasMore }: Props) {
  const sp = useSearchParams();
  const filterKey = buildFilterKey(new URLSearchParams(sp.toString()));

  const [items, setItems] = useState<Anime[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Восстановление состояния при возврате назад (sessionStorage).
  // Делаем один раз на mount/смену фильтра — initialItems используются как fallback.
  const restoredKey = useRef<string | null>(null);
  useEffect(() => {
    if (restoredKey.current === filterKey) return;
    restoredKey.current = filterKey;
    try {
      const raw = sessionStorage.getItem(`kage-catalog:${filterKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed?.items?.length && parsed.items.length >= initialItems.length) {
          setItems(parsed.items);
          setPage(parsed.page);
          setHasMore(parsed.hasMore);
          // scroll restore — после следующего кадра, когда DOM уже отрисован
          requestAnimationFrame(() => {
            window.scrollTo(0, parsed.scrollY || 0);
          });
          return;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    // Фильтры сменились → новый стартовый набор
    setItems(initialItems);
    setPage(1);
    setHasMore(initialHasMore);
    setFailed(false);
  }, [filterKey, initialItems, initialHasMore]);

  // Сохраняем перед уходом со страницы / при изменении состояния.
  useEffect(() => {
    function save() {
      try {
        const payload: PersistedState = {
          items,
          page,
          hasMore,
          scrollY: window.scrollY,
        };
        sessionStorage.setItem(`kage-catalog:${filterKey}`, JSON.stringify(payload));
      } catch {
        // quota / SSR — игнор
      }
    }
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [items, page, hasMore, filterKey]);

  // IntersectionObserver на сентинеле — подгружаем следующую страницу.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, filterKey]);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setFailed(false);
    const next = page + 1;
    try {
      const params = new URLSearchParams(filterKey);
      params.set("page", String(next));
      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (!res.ok) throw new Error("bad_response");
      const data = (await res.json()) as {
        items: Anime[];
        hasMore: boolean;
      };
      setItems((prev) => [...prev, ...data.items]);
      setPage(next);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="grid gap-3 sm:gap-4"
        style={{
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(50% - 0.375rem, 170px), 1fr))",
        }}
      >
        {items.map((a, i) => (
          <Link
            key={`${a.id}-${i}`}
            href={`/anime/${a.id}`}
            className="group transition-transform hover:-translate-y-1"
          >
            <KagePoster anime={a} dense />
            <div className="mt-2.5 flex items-center gap-2 text-xs text-text-dim">
              {a.rating > 0 && <Rating value={a.rating} size={11} />}
              {a.year > 0 && (
                <>
                  <span>·</span>
                  <span>{a.year}</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && !failed && (
        <div ref={sentinelRef} className="h-12 w-full" aria-hidden />
      )}

      {loading && (
        <div className="mt-6 text-center text-sm text-text-dim">Загрузка…</div>
      )}

      {failed && (
        <div className="mt-6 flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-text-dim">Не удалось подгрузить дальше.</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Повторить
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="mt-8 text-center text-xs text-text-dim">
          Это всё, что найдено.
        </div>
      )}
    </>
  );
}

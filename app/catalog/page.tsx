import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { fetchAnimes, type AnimeOrder } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { CatalogControls } from "@/components/kage/catalog-controls";
import { KagePoster } from "@/components/kage/poster";
import { Rating } from "@/components/kage/rating";
import { cn } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Каталог",
  description: "Каталог аниме на данных Shikimori — фильтры по жанру и сортировка.",
};

const PAGE_SIZE = 24;

type SP = Record<string, string | string[] | undefined>;

function pluralTitles(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "тайтлов";
  if (m10 === 1) return "тайтл";
  if (m10 >= 2 && m10 <= 4) return "тайтла";
  return "тайтлов";
}

function buildHref(sp: SP, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page") continue;
    if (typeof v === "string" && v) params.set(k, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const genre = typeof sp.genre === "string" ? sp.genre : undefined;
  const order = (typeof sp.order === "string" ? sp.order : "popularity") as AnimeOrder;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  let items: Anime[] = [];
  let failed = false;
  try {
    const list = await fetchAnimes(
      { page, limit: PAGE_SIZE, order, genre, search },
      300,
    );
    items = list.map(mapShikiToAnime);
  } catch {
    failed = true;
  }

  const hasNext = items.length === PAGE_SIZE;

  return (
    <div className="mx-auto max-w-[1600px] py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
      <h1 className="font-display mb-6 text-[clamp(2rem,4.5vw,3.5rem)]">Каталог</h1>

      <CatalogControls />

      <div className="mb-5 mt-6 text-xs text-text-dim">
        {failed
          ? "Не удалось загрузить каталог. Попробуйте обновить страницу."
          : `${items.length}${hasNext ? "+" : ""} ${pluralTitles(items.length)} на странице ${page}`}
      </div>

      {items.length > 0 ? (
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            // auto-fill: 2 кол. на телефоне → плавно больше с шириной.
            // Нижний предел 150px не даёт постеру стать неузнаваемо мелким.
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(50% - 0.375rem, 170px), 1fr))",
          }}
        >
          {items.map((a) => (
            <Link
              key={a.id}
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
      ) : (
        !failed && (
          <p className="py-16 text-center text-text-dim">
            По вашему запросу ничего не найдено.
          </p>
        )
      )}

      {(page > 1 || hasNext) && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <PageLink
            href={buildHref(sp, page - 1)}
            disabled={page <= 1}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft className="size-4" />
            Назад
          </PageLink>
          <span className="text-sm text-text-dim">Стр. {page}</span>
          <PageLink
            href={buildHref(sp, page + 1)}
            disabled={!hasNext}
            aria-label="Следующая страница"
          >
            Вперёд
            <ChevronRight className="size-4" />
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  const className = cn(
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium transition-colors",
    disabled
      ? "pointer-events-none opacity-40"
      : "text-foreground hover:bg-surface-2",
  );
  if (disabled) {
    return (
      <span className={className} aria-disabled {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

import type { Metadata } from "next";

import { fetchAnimes, type AnimeOrder } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import type { Anime } from "@/lib/anime/types";
import { CatalogControls } from "@/components/kage/catalog-controls";
import { CatalogInfinite } from "@/components/kage/catalog-infinite";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page") continue;
    if (typeof v === "string" && v) params.set(k, v);
  }
  const qs = params.toString();
  const canonical = qs ? `/catalog?${qs}` : "/catalog";
  return {
    title: "Каталог",
    description:
      "Каталог аниме на данных Shikimori — фильтры по жанру и сортировка.",
    alternates: { canonical },
  };
}

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

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  // Поддерживаем legacy ?genre=1, ?tag=1 (теги настроения), multi-select ?genres=1,4
  const genres =
    typeof sp.genres === "string"
      ? sp.genres
      : typeof sp.genre === "string"
        ? sp.genre
        : typeof sp.tag === "string"
          ? sp.tag
          : undefined;
  const kind = typeof sp.kind === "string" && sp.kind ? sp.kind : undefined;
  const status =
    typeof sp.status === "string" && sp.status
      ? (sp.status as "ongoing" | "released" | "anons")
      : undefined;
  const year = typeof sp.year === "string" && sp.year ? sp.year : undefined;
  const season =
    typeof sp.season === "string" && sp.season ? sp.season : undefined;
  // Shikimori SeasonString: "winter_2024" | "2024" — комбинируем сезон с годом
  const seasonParam = season && year ? `${season}_${year}` : year ? year : undefined;
  const order = (typeof sp.order === "string" ? sp.order : "popularity") as AnimeOrder;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  let items: Anime[] = [];
  let failed = false;
  try {
    const list = await fetchAnimes(
      {
        page: 1,
        limit: PAGE_SIZE,
        order,
        genre: genres,
        kind,
        status,
        season: seasonParam,
        search,
      },
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
          : `${items.length}${hasNext ? "+" : ""} ${pluralTitles(items.length)}`}
      </div>

      {items.length > 0 ? (
        <CatalogInfinite initialItems={items} initialHasMore={hasNext} />
      ) : (
        !failed && (
          <p className="py-16 text-center text-text-dim">
            По вашему запросу ничего не найдено.
          </p>
        )
      )}
    </div>
  );
}

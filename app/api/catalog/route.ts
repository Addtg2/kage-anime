import { fetchAnimes, type AnimeOrder } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";

const PAGE_SIZE = 24;

// Подгрузка очередной страницы каталога для infinite-scroll.
// Параметры идентичны server-стороне /catalog: genres|genre|tag, kind,
// status, season, year, order, search, page.
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const genres =
    sp.get("genres") ?? sp.get("genre") ?? sp.get("tag") ?? undefined;
  const kind = sp.get("kind") || undefined;
  const status = (sp.get("status") || undefined) as
    | "ongoing"
    | "released"
    | "anons"
    | undefined;
  const year = sp.get("year") || undefined;
  const season = sp.get("season") || undefined;
  const seasonParam = season && year ? `${season}_${year}` : year || undefined;
  const order = (sp.get("order") || "popularity") as AnimeOrder;
  const search = sp.get("search") || undefined;

  try {
    const list = await fetchAnimes(
      {
        page,
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
    const items = list.map(mapShikiToAnime);
    return Response.json({ items, hasMore: items.length === PAGE_SIZE });
  } catch {
    return Response.json(
      { items: [], hasMore: false, error: "fetch_failed" },
      { status: 500 },
    );
  }
}

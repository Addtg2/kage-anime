import { fetchAnimes } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";

// Поисковые подсказки. GET /api/search?q=...
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ items: [] });
  try {
    const list = await fetchAnimes(
      { search: q, order: "popularity", limit: 8 },
      120,
    );
    const items = list.map(mapShikiToAnime).map((a) => ({
      id: a.id,
      titleRu: a.titleRu,
      titleJp: a.titleJp,
      year: a.year,
      rating: a.rating,
      posterUrl: a.posterUrl ?? null,
    }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [], error: "fetch_failed" });
  }
}

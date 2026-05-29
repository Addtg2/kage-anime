import { fetchAnimes } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// Поисковые подсказки. GET /api/search?q=...
export async function GET(request: Request) {
  const ip = getClientIP(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return Response.json(
      { items: [], error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

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

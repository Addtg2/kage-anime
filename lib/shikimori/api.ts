import { shikimoriClient } from "./client";
import {
  ANIMES_LIST,
  ANIMES_BY_IDS,
  ANIME_DETAIL,
  ANIME_EXTRAS,
  ANIMES_BY_FRANCHISE,
} from "./queries";
import {
  ShikiAnimesResponseSchema,
  ShikiExtrasResponseSchema,
  ShikiFranchiseResponseSchema,
  type ShikiAnime,
  type ShikiFranchiseEntry,
  type ShikiRelated,
  type ShikiScreenshot,
  type ShikiVideo,
} from "./types";

export type AnimeOrder =
  | "popularity"
  | "ranked"
  | "aired_on"
  | "name"
  | "id"
  | "kind"
  | "episodes"
  | "status";

export interface AnimesParams {
  page?: number;
  limit?: number;
  order?: AnimeOrder;
  kind?: string;
  status?: "ongoing" | "released" | "anons";
  season?: string;
  search?: string;
  genre?: string;
}

/** Список аниме с фильтрами. Ответ валидируется zod. */
export async function fetchAnimes(
  params: AnimesParams = {},
  revalidate = 300,
): Promise<ShikiAnime[]> {
  const data = await shikimoriClient(revalidate).request(ANIMES_LIST, params);
  return ShikiAnimesResponseSchema.parse(data).animes;
}

/** Детальная карточка по id. null — если тайтл не найден. */
export async function fetchAnimeById(
  id: string,
  revalidate = 1800,
): Promise<ShikiAnime | null> {
  const data = await shikimoriClient(revalidate).request(ANIME_DETAIL, { ids: id });
  const list = ShikiAnimesResponseSchema.parse(data).animes;
  return list[0] ?? null;
}

export interface AnimeExtras {
  videos: ShikiVideo[];
  screenshots: ShikiScreenshot[];
  related: ShikiRelated[];
}

/** Видео/скриншоты/связанные. На любую ошибку — пустой результат, не валим страницу. */
export async function fetchAnimeExtras(
  id: string,
  revalidate = 1800,
): Promise<AnimeExtras> {
  try {
    const data = await shikimoriClient(revalidate).request(ANIME_EXTRAS, {
      ids: id,
    });
    const parsed = ShikiExtrasResponseSchema.parse(data);
    const first = parsed.animes[0];
    if (!first) return { videos: [], screenshots: [], related: [] };
    return {
      videos: first.videos ?? [],
      screenshots: first.screenshots ?? [],
      related: first.related ?? [],
    };
  } catch {
    return { videos: [], screenshots: [], related: [] };
  }
}

/**
 * Кураторское "похожее" из Shikimori REST `/api/animes/:id/similar`.
 * Возвращает ShikiAnime[], готовые к `mapShikiToAnime`. На любой сбой
 * (rate-limit, недоступность REST, пустой ответ) возвращает [] — вызывающий
 * откатывается на жанровый fallback. ISR 1ч.
 */
export async function fetchSimilar(
  id: string,
  revalidate = 3600,
): Promise<ShikiAnime[]> {
  try {
    const gqlUrl =
      process.env.SHIKIMORI_API_URL ?? "https://shikimori.io/api/graphql";
    const restBase = gqlUrl.replace(/\/api\/graphql\/?$/, "");
    const restUrl = `${restBase}/api/animes/${encodeURIComponent(id)}/similar`;
    const res = await fetch(restUrl, {
      headers: {
        "User-Agent":
          process.env.SHIKIMORI_USER_AGENT ?? "KAGE/1.0 (anime catalog)",
      },
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0) return [];
    const ids = data
      .map((x) => (typeof x === "object" && x && "id" in x ? String((x as { id: unknown }).id) : null))
      .filter((x): x is string => !!x && /^\d+$/.test(x))
      .slice(0, 12);
    if (ids.length === 0) return [];
    const gqlData = await shikimoriClient(revalidate).request(ANIMES_BY_IDS, {
      ids: ids.join(","),
    });
    const parsed = ShikiAnimesResponseSchema.parse(gqlData).animes;
    // Восстанавливаем порядок из REST (Shikimori ранжирует похожесть, GraphQL — нет).
    const order = new Map(ids.map((x, i) => [x, i]));
    return [...parsed].sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  } catch {
    return [];
  }
}

/** Список тайтлов одной франшизы (по airedOn). На ошибку — пустой массив. */
export async function fetchFranchise(
  franchise: string,
  revalidate = 3600,
): Promise<ShikiFranchiseEntry[]> {
  try {
    const data = await shikimoriClient(revalidate).request(ANIMES_BY_FRANCHISE, {
      franchise,
    });
    return ShikiFranchiseResponseSchema.parse(data).animes;
  } catch {
    return [];
  }
}

/** Случайный популярный тайтл — id для редиректа. */
export async function fetchRandomAnime(): Promise<string | null> {
  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const list = await fetchAnimes({ order: "popularity", limit: 50, page }, 0);
    if (!list.length) return null;
    const pick = list[Math.floor(Math.random() * list.length)];
    return pick?.id ?? null;
  } catch {
    return null;
  }
}

export interface ScheduleRawEntry {
  shiki: ShikiAnime;
  nextAt: Date;
  nextEpisode: number;
}

/** Онгоинги с предстоящим выходом серии, отсортированные по времени выхода. ISR 1ч. */
export async function fetchSchedule(revalidate = 3600): Promise<ScheduleRawEntry[]> {
  const list = await fetchAnimes(
    { status: "ongoing", order: "popularity", limit: 50 },
    revalidate,
  );
  const now = Date.now();
  const result: ScheduleRawEntry[] = [];
  for (const shiki of list) {
    if (!shiki.nextEpisodeAt) continue;
    const nextAt = new Date(shiki.nextEpisodeAt);
    if (nextAt.getTime() <= now) continue;
    result.push({ shiki, nextAt, nextEpisode: shiki.episodesAired + 1 });
  }
  return result.sort((a, b) => a.nextAt.getTime() - b.nextAt.getTime());
}

/** Текущий сезон в формате Shikimori, напр. "spring_2026". Декабрь → зима след. года. */
export function currentSeason(date = new Date()): string {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const name =
    m === 12 || m <= 2 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "fall";
  const year = m === 12 ? y + 1 : y;
  return `${name}_${year}`;
}

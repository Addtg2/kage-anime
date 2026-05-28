import { shikimoriClient } from "./client";
import { ANIMES_LIST, ANIME_DETAIL, ANIME_EXTRAS } from "./queries";
import {
  ShikiAnimesResponseSchema,
  ShikiExtrasResponseSchema,
  type ShikiAnime,
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

/** Текущий сезон в формате Shikimori, напр. "spring_2026". Декабрь → зима след. года. */
export function currentSeason(date = new Date()): string {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const name =
    m === 12 || m <= 2 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "fall";
  const year = m === 12 ? y + 1 : y;
  return `${name}_${year}`;
}

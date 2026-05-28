import type { Anime } from "./types";
import type { ShikiAnime } from "@/lib/shikimori/types";

// Палитры для постера-плейсхолдера/скрима (когда нет картинки или для тинта оверлея).
const PALETTES: [string, string, string][] = [
  ["#1a3a4f", "#5fbac0", "#f0e4c3"],
  ["#1b1b2e", "#5b2a86", "#ff4d6d"],
  ["#0e2e2a", "#1f8a5b", "#f6d365"],
  ["#231910", "#a23e1a", "#e8c89c"],
  ["#2c1f3f", "#e85b8a", "#fce38a"],
  ["#1a0e0e", "#ff3b30", "#f5a623"],
  ["#0d1b2a", "#415a77", "#d4cba0"],
  ["#1d0a2e", "#ff4ecd", "#7c4dff"],
  ["#102a3a", "#00d4d4", "#ff6f3c"],
  ["#0c0c2a", "#7c3aed", "#22d3ee"],
];

function paletteFor(id: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// Возрастной рейтинг Shikimori → привычная маркировка.
const AGE: Record<string, string> = {
  g: "0+",
  pg: "6+",
  pg_13: "12+",
  r: "16+",
  r_plus: "18+",
  rx: "18+",
};

function isMissingPoster(url?: string | null): boolean {
  return !url || /missing/i.test(url);
}

// Убираем BBCode-теги Shikimori ([b], [character=..] и пр.) и схлопываем пробелы.
function cleanDescription(d?: string | null): string {
  if (!d) return "";
  return d
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max = 160): string {
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Маппинг тайтла Shikimori в общую модель Anime, на которой работает UI KAGE. */
export function mapShikiToAnime(a: ShikiAnime): Anime {
  const poster = a.poster?.mainUrl;
  const synopsis = cleanDescription(a.description);
  return {
    id: a.id,
    title: a.name,
    titleRu: a.russian || a.name,
    titleJp: a.japanese ?? "",
    year: a.airedOn?.year ?? 0,
    eps: a.episodes || a.episodesAired || 0,
    rating: a.score ?? 0,
    age: a.rating ? (AGE[a.rating] ?? "") : "",
    genres: (a.genres ?? [])
      .map((g) => g.russian)
      .filter((x): x is string => Boolean(x)),
    studio: a.studios?.[0]?.name ?? "",
    tagline: truncate(synopsis) || "Смотрите прямо сейчас на KAGE.",
    synopsis,
    palette: paletteFor(a.id),
    posterUrl: isMissingPoster(poster) ? undefined : poster!,
  };
}

// Серверный клиент Kodik. Токен НИКОГДА не уходит в браузер.
//
// Важное про Kodik (проверено вживую, май 2026):
//  • Классический хост kodikapi.com мёртв (нет DNS-записи глобально).
//    Живой API — https://kodik-api.com.
//  • /get-player принимает ПУБЛИЧНЫЙ токен (встроен в скрипт плеера) и
//    резолвит напрямую по shikimoriID → готовая ссылка на iframe.
//  • /search с публичным токеном иногда отвечает 403; пытаемся первым делом
//    собрать список озвучек оттуда, а если он не отдал — фолбэк на /get-player.

export interface KodikTranslation {
  id: number;
  title: string;
  /** "voice" | "subtitles" | ... */
  type: string;
  /** Готовый https-URL для iframe */
  src: string;
}

export interface PlayerSource {
  available: boolean;
  /** Готовый https-URL для <iframe src> (дефолтная озвучка) */
  src?: string;
  /** Список альтернативных озвучек, если удалось вытащить */
  translations?: KodikTranslation[];
  /** Причина недоступности: no_token | not_found | http_xxx | fetch_failed */
  error?: string;
}

const API_HOST = process.env.KODIK_API_HOST ?? "https://kodik-api.com";
const PLAYER_SCRIPT = "https://kodik-add.com/add-players.min.js?v=2";

function withProtocol(url: string): string {
  return url.startsWith("//") ? `https:${url}` : url;
}

let tokenCache: { value: string; at: number } | null = null;
const TOKEN_TTL_MS = 60 * 60 * 1000;

async function getToken(): Promise<string | null> {
  const envToken = process.env.KODIK_TOKEN;
  if (envToken) return envToken;

  if (tokenCache && Date.now() - tokenCache.at < TOKEN_TTL_MS) {
    return tokenCache.value;
  }
  try {
    const res = await fetch(PLAYER_SCRIPT, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/token\s*[=:]\s*["']([0-9a-f]{16,})["']/i);
    const token = match?.[1] ?? null;
    if (token) tokenCache = { value: token, at: Date.now() };
    return token;
  } catch {
    return null;
  }
}

export function withEpisode(src: string, episode: number): string {
  try {
    const u = new URL(src, "https://x");
    u.searchParams.set("episode", String(episode));
    return src.startsWith("//") ? `//${u.host}${u.pathname}${u.search}` : u.toString();
  } catch {
    return src;
  }
}

/** Добавляет стартовую позицию в URL Kodik-плеера (`start_from=N`, секунды). */
export function withStart(src: string, seconds: number): string {
  if (!seconds || seconds < 5) return src;
  try {
    const u = new URL(src, "https://x");
    u.searchParams.set("start_from", String(Math.floor(seconds)));
    return src.startsWith("//") ? `//${u.host}${u.pathname}${u.search}` : u.toString();
  } catch {
    return src;
  }
}

/**
 * Прячет внутренние селекторы Kodik (сезон/серия/озвучка), чтобы единственным
 * источником истины оставался KAGE: озвучка сохраняется в zustand, серии — в URL.
 * Иначе пользователь меняет озвучку внутри iframe, а KAGE этого не видит
 * (Kodik не шлёт postMessage о смене translation) → при переходе по сетке серий выбор сбрасывается.
 */
export function withHiddenSelectors(src: string): string {
  try {
    const u = new URL(src, "https://x");
    u.searchParams.set("translations", "false");
    u.searchParams.set("season_selector", "false");
    u.searchParams.set("episodes_selector", "false");
    u.searchParams.set("min_episode_selector_columns", "0");
    return src.startsWith("//") ? `//${u.host}${u.pathname}${u.search}` : u.toString();
  } catch {
    return src;
  }
}

interface SearchResult {
  link?: string;
  translation?: { id?: number; title?: string; type?: string };
}

async function tryFetchTranslations(
  token: string,
  shikimoriId: string,
  revalidate: number,
): Promise<KodikTranslation[]> {
  try {
    const url = new URL(`${API_HOST}/search`);
    url.searchParams.set("token", token);
    url.searchParams.set("shikimori_id", shikimoriId);
    url.searchParams.set("limit", "50");
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: SearchResult[] };
    if (!Array.isArray(data?.results)) return [];
    const seen = new Map<number, KodikTranslation>();
    for (const r of data.results) {
      const t = r.translation;
      if (!t?.id || !r.link) continue;
      if (seen.has(t.id)) continue;
      seen.set(t.id, {
        id: t.id,
        title: String(t.title || "По умолчанию"),
        type: String(t.type || "voice"),
        src: withProtocol(r.link),
      });
    }
    const list = Array.from(seen.values());
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === "voice" ? -1 : 1;
      return a.title.localeCompare(b.title, "ru");
    });
    return list;
  } catch {
    return [];
  }
}

export async function kodikSearch(
  shikimoriId: string,
  revalidate = 600,
): Promise<PlayerSource> {
  const token = await getToken();
  if (!token) return { available: false, error: "no_token" };

  // Сначала пробуем /search — там список озвучек. Если получили — отдаём с translations.
  const translations = await tryFetchTranslations(token, shikimoriId, revalidate);
  if (translations.length > 0) {
    return { available: true, src: translations[0]!.src, translations };
  }

  // Фолбэк: /get-player отдаёт дефолтную ссылку без списка озвучек.
  const url = new URL(`${API_HOST}/get-player`);
  url.searchParams.set("token", token);
  url.searchParams.set("shikimoriID", shikimoriId);

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return { available: false, error: `http_${res.status}` };
    const data = (await res.json()) as {
      found?: boolean;
      link?: string;
      error?: string;
    };
    if (!data.found || !data.link) return { available: false, error: "not_found" };
    return { available: true, src: withProtocol(data.link) };
  } catch {
    return { available: false, error: "fetch_failed" };
  }
}

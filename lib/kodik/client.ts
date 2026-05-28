// Серверный клиент Kodik. Токен НИКОГДА не уходит в браузер.
//
// Важное про Kodik (проверено вживую, май 2026):
//  • Классический хост kodikapi.com мёртв (нет DNS-записи глобально).
//    Живой API — https://kodik-api.com.
//  • Эндпоинт /search требует ЗАРЕГИСТРИРОВАННЫЙ токен (kodik.cc) — публичный
//    токен из плеера он отклоняет.
//  • Зато /get-player принимает ПУБЛИЧНЫЙ токен (встроен в скрипт плеера Kodik)
//    и резолвит напрямую по shikimoriID → готовая ссылка на iframe.
//    Поэтому по умолчанию берём публичный токен автоматически и ходим в /get-player.
//    KODIK_TOKEN из .env переопределяет автоток (если есть зарегистрированный).

export interface PlayerSource {
  available: boolean;
  /** Готовый https-URL для <iframe src> */
  src?: string;
  /** Причина недоступности: no_token | not_found | http_xxx | fetch_failed */
  error?: string;
}

const API_HOST = process.env.KODIK_API_HOST ?? "https://kodik-api.com";
const PLAYER_SCRIPT = "https://kodik-add.com/add-players.min.js?v=2";

function withProtocol(url: string): string {
  return url.startsWith("//") ? `https:${url}` : url;
}

// Кеш публичного токена в памяти процесса (плюс кеш самого скрипта через Next).
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
    // в скрипте: ...r.token="<hex>"...
    const match = text.match(/token\s*[=:]\s*["']([0-9a-f]{16,})["']/i);
    const token = match?.[1] ?? null;
    if (token) tokenCache = { value: token, at: Date.now() };
    return token;
  } catch {
    return null;
  }
}

export async function kodikSearch(
  shikimoriId: string,
  revalidate = 600,
): Promise<PlayerSource> {
  const token = await getToken();
  if (!token) return { available: false, error: "no_token" };

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

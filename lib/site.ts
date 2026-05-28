/**
 * Канонический URL сайта. Берётся из NEXT_PUBLIC_SITE_URL (Vercel автоматически
 * прокидывает в NEXT_PUBLIC_SITE_URL/VERCEL_URL); fallback — localhost для dev.
 */
export const SITE_URL = (() => {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (!env) return "http://localhost:3000";
  return env.startsWith("http") ? env : `https://${env}`;
})();

export const SITE_NAME = "KAGE 影";
export const SITE_DESCRIPTION =
  "Кинематографичный онлайн-кинотеатр аниме. Каталог на данных Shikimori, видео через Kodik и Alloha.";

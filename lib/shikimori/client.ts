import { GraphQLClient } from "graphql-request";

// Рабочий эндпоинт — shikimori.io (.one/.me/.org недоступны). User-Agent обязателен.
const ENDPOINT =
  process.env.SHIKIMORI_API_URL ?? "https://shikimori.io/api/graphql";
const USER_AGENT =
  process.env.SHIKIMORI_USER_AGENT ?? "KAGE/1.0 (anime catalog)";

/**
 * GraphQL-клиент Shikimori с серверным кешем Next.js (ISR).
 * @param revalidate — TTL кеша в секундах (списки ~300, детали ~1800).
 */
export function shikimoriClient(revalidate = 300): GraphQLClient {
  return new GraphQLClient(ENDPOINT, {
    headers: { "User-Agent": USER_AGENT },
    // Оборачиваем fetch, чтобы прокинуть next.revalidate (кеш на стороне сервера).
    fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, next: { revalidate } })) as typeof fetch,
  });
}

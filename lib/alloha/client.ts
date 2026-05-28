// Серверный клиент Alloha. Токен из env, в браузер не уходит.
// GET https://api.alloha.tv/?token=..&shikimori_id=.. → data.iframe

import type { PlayerSource } from "@/lib/kodik/client";

function withProtocol(url: string): string {
  return url.startsWith("//") ? `https:${url}` : url;
}

export async function allohaSearch(
  shikimoriId: string,
  revalidate = 600,
): Promise<PlayerSource> {
  const token = process.env.ALLOHA_TOKEN;
  if (!token) return { available: false, error: "no_token" };

  const url = new URL("https://api.alloha.tv/");
  url.searchParams.set("token", token);
  url.searchParams.set("shikimori_id", shikimoriId);

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return { available: false, error: `http_${res.status}` };
    const data = (await res.json()) as { data?: { iframe?: string } };
    const iframe = data.data?.iframe;
    if (!iframe) return { available: false, error: "not_found" };
    return { available: true, src: withProtocol(iframe) };
  } catch {
    return { available: false, error: "fetch_failed" };
  }
}

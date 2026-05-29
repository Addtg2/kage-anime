import type { MetadataRoute } from "next";

import { fetchAnimes } from "@/lib/shikimori/api";
import { SITE_URL } from "@/lib/site";

// Sitemap пересобирается раз в сутки. Если Shikimori отвалился — отдаём только
// статические маршруты, чтобы сборка не падала.
export const revalidate = 86400;

function scoreToPriority(score: number | null): number {
  if (!score) return 0.6;
  if (score >= 8.0) return 0.9;
  if (score >= 7.0) return 0.8;
  if (score >= 6.0) return 0.7;
  return 0.6;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/catalog?order=aired_on`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/catalog?order=ranked`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    // Топ-500: 5 страниц popularity + 5 страниц ranked (до 500 уникальных после дедупа).
    const pages = await Promise.all([
      fetchAnimes({ order: "popularity", limit: 50, page: 1 }, 86400),
      fetchAnimes({ order: "popularity", limit: 50, page: 2 }, 86400),
      fetchAnimes({ order: "popularity", limit: 50, page: 3 }, 86400),
      fetchAnimes({ order: "popularity", limit: 50, page: 4 }, 86400),
      fetchAnimes({ order: "popularity", limit: 50, page: 5 }, 86400),
      fetchAnimes({ order: "ranked", limit: 50, page: 1 }, 86400),
      fetchAnimes({ order: "ranked", limit: 50, page: 2 }, 86400),
      fetchAnimes({ order: "ranked", limit: 50, page: 3 }, 86400),
      fetchAnimes({ order: "ranked", limit: 50, page: 4 }, 86400),
      fetchAnimes({ order: "ranked", limit: 50, page: 5 }, 86400),
    ]);
    const seen = new Set<string>();
    for (const list of pages) {
      for (const a of list) {
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        base.push({
          url: `${SITE_URL}/anime/${a.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: scoreToPriority(a.score),
        });
      }
    }
  } catch {
    // Без тайтлов — sitemap всё равно валиден.
  }

  return base;
}

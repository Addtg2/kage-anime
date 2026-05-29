import { z } from "zod";

// Zod-схемы ответа Shikimori GraphQL. Все опциональные поля .nullable() —
// API щедро отдаёт null, лучше провалидировать, чем ловить runtime-сюрпризы.

export const ShikiPosterSchema = z.object({
  mainUrl: z.string(),
  originalUrl: z.string(),
});

export const ShikiGenreSchema = z.object({
  id: z.string(),
  russian: z.string().nullable(),
  kind: z.string().nullable(),
});

export const ShikiDateSchema = z.object({
  year: z.number().nullable(),
  date: z.string().nullable(),
});

export const ShikiAnimeSchema = z.object({
  id: z.string(),
  malId: z.string().nullable(),
  name: z.string(),
  russian: z.string().nullable(),
  japanese: z.string().nullable(),
  kind: z.string().nullable(),
  status: z.string().nullable(),
  score: z.number().nullable(),
  episodes: z.number(),
  episodesAired: z.number(),
  duration: z.number().nullable(),
  rating: z.string().nullable(),
  season: z.string().nullable(),
  nextEpisodeAt: z.string().nullable(),
  description: z.string().nullable(),
  airedOn: ShikiDateSchema.nullable(),
  poster: ShikiPosterSchema.nullable(),
  genres: z.array(ShikiGenreSchema).nullable(),
  // запрашивается только в детальном запросе; в списке отсутствует
  studios: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .nullish(),
  // только в детальном запросе; имя франшизы для группировки тайтлов
  franchise: z.string().nullish(),
});

// Один тайтл во франшизе — компактная подвыборка для секции "Порядок просмотра".
export const ShikiFranchiseEntrySchema = z.object({
  id: z.string(),
  russian: z.string().nullable(),
  name: z.string(),
  kind: z.string().nullable(),
  episodes: z.number(),
  status: z.string().nullable(),
  airedOn: ShikiDateSchema.nullable(),
  poster: z.object({ mainUrl: z.string() }).nullable(),
});

export const ShikiFranchiseResponseSchema = z.object({
  animes: z.array(ShikiFranchiseEntrySchema),
});

export type ShikiFranchiseEntry = z.infer<typeof ShikiFranchiseEntrySchema>;

export const ShikiAnimesResponseSchema = z.object({
  animes: z.array(ShikiAnimeSchema),
});

export type ShikiAnime = z.infer<typeof ShikiAnimeSchema>;

// === EXTRAS (видео/скриншоты/связанные) ===

export const ShikiVideoSchema = z.object({
  id: z.string(),
  url: z.string(),
  playerUrl: z.string().nullable(),
  name: z.string().nullable(),
  // kind: pv, op, ed, character_trailer, episode_preview, etc.
  kind: z.string().nullable(),
});

export const ShikiScreenshotSchema = z.object({
  id: z.string(),
  originalUrl: z.string(),
  x166Url: z.string().nullable(),
});

const ShikiRelatedAnimeSchema = z.object({
  id: z.string(),
  russian: z.string().nullable(),
  name: z.string(),
  score: z.number().nullable(),
  airedOn: z
    .object({
      year: z.number().nullable(),
    })
    .nullable(),
  poster: z
    .object({
      mainUrl: z.string(),
    })
    .nullable(),
});

export const ShikiRelatedSchema = z.object({
  relationRu: z.string().nullable(),
  anime: ShikiRelatedAnimeSchema.nullable(),
});

export const ShikiExtrasResponseSchema = z.object({
  animes: z.array(
    z.object({
      id: z.string(),
      videos: z.array(ShikiVideoSchema).nullable(),
      screenshots: z.array(ShikiScreenshotSchema).nullable(),
      related: z.array(ShikiRelatedSchema).nullable(),
    }),
  ),
});

export type ShikiVideo = z.infer<typeof ShikiVideoSchema>;
export type ShikiScreenshot = z.infer<typeof ShikiScreenshotSchema>;
export type ShikiRelated = z.infer<typeof ShikiRelatedSchema>;

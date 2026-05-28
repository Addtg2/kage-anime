# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```powershell
# pnpm is in %APPDATA%\npm but often NOT on the tool-shell PATH.
# Prefix this once per shell before pnpm commands:
$env:Path = "$env:APPDATA\npm;$env:Path"

pnpm dev      # Next 16 + Turbopack on :3000 (or auto-picks :3001 if 3000 busy)
pnpm build    # production build — also runs typecheck
pnpm start    # serve built output
pnpm lint     # eslint (config: eslint-config-next 16)
```

There is **no test runner configured** — adding tests means scaffolding Vitest/Playwright first.

Verifying changes is normally done by `pnpm build` (catches TS errors) + curling routes against a running dev server. The dev server stays warm between sessions; check whether port 3000 already has one before starting a new one.

## Architecture

### Data flow (server-rendered routes)

Every server component on `/`, `/catalog`, `/anime/[id]`, `/anime/[id]/watch` follows the same pipeline:

1. **Shikimori GraphQL** ([lib/shikimori/client.ts](lib/shikimori/client.ts)) — wraps `graphql-request` with Next ISR (`next.revalidate`). The working endpoint is `shikimori.io` only — `.one/.me/.org` are dead.
2. **Zod validation** ([lib/shikimori/types.ts](lib/shikimori/types.ts)) — every field is `.nullable()` because Shikimori is generous with nulls. Strict variable types in queries: `PositiveInt`, `OrderEnum`, `AnimeKindString`, `AnimeStatusString`, `SeasonString` ([lib/shikimori/queries.ts](lib/shikimori/queries.ts)). `limit` ≤ 50.
3. **Anime mapper** ([lib/anime/map.ts](lib/anime/map.ts)) — `mapShikiToAnime()` converts the raw response to the single domain type `Anime` ([lib/anime/types.ts](lib/anime/types.ts)) that the whole UI consumes. Adds palette hash, cleans BBCode from description, maps age ratings.
4. **Two parallel queries on detail page**: `ANIME_DETAIL` (main) + `ANIME_EXTRAS` (videos/screenshots/related). Extras live in their own query and `fetchAnimeExtras` swallows errors, so extras failures never break the detail page.
5. **`cache()` dedup**: detail page wraps `fetchAnimeById` with React's `cache()` so `generateMetadata` and the page body share a single fetch.

Player sources are server-resolved separately:
- [lib/kodik/client.ts](lib/kodik/client.ts) — auto-extracts the public Kodik token from `kodik-add.com/add-players.min.js` and hits `/get-player?shikimoriID=…`. **Do not switch to `/search`** — it requires a registered token. **Do not hit `kodikapi.com`** — DNS-dead.
- [lib/alloha/client.ts](lib/alloha/client.ts) — needs `ALLOHA_TOKEN` (rare); falls back to `available: false`.

### Local state (client-only)

Personalization lives entirely in the browser — no auth, no backend writes.

- **`useLibraryStore`** ([lib/store/library.ts](lib/store/library.ts)) — zustand + `persist` (localStorage `kage-library-v1`). Watchlist statuses: `watching|planned|completed|dropped`. Stores anime snapshots so `/mylist` doesn't need to refetch.
- **`useSettingsStore`** ([lib/store/settings.ts](lib/store/settings.ts)) — same pattern, key `kage-settings-v1`.
- **Dexie** ([lib/db/dexie.ts](lib/db/dexie.ts)) — IndexedDB `kage-db-v1`, single `history` table. `db()` returns `null` server-side; consumers must handle that. Hooks in [lib/db/hooks.ts](lib/db/hooks.ts) use `useLiveQuery` (cross-tab updates for free).
- **Hydration pattern**: any client component that reads a persisted store must gate visible state on `useHydrated()` ([lib/store/use-hydrated.ts](lib/store/use-hydrated.ts)) — otherwise SSR renders one thing and the post-hydrate client renders another, causing React warnings. Pattern: counts default to `0`/lists default to `[]` until `hydrated === true`.

### UI conventions

- **Fluid sizing everywhere** — typography, padding, gap, hero heights all use `clamp(min, NNvw, max)`, not Tailwind breakpoints. The exception is `grid-cols-*` which uses `auto-fill` with `minmax(min(50% - 0.375rem, NNNpx), 1fr)` for poster grids.
- **View Transitions** are enabled via `experimental.viewTransition: true` in `next.config.ts` + CSS `@view-transition { navigation: auto }` in `app/globals.css`. Cross-route morph works by giving the source poster ([components/kage/poster.tsx](components/kage/poster.tsx)) and the destination hero card ([components/kage/hero-poster-card.tsx](components/kage/hero-poster-card.tsx)) the same inline `viewTransitionName: \`poster-${anime.id}\``. Don't add the name elsewhere unless you intend it to morph.
- **Server vs client components** are sharply separated. Anything reading zustand/Dexie or using state must be `"use client"`. The detail page is a server component; client-only widgets (status dropdown, trailer modal, action buttons) are imported as islands. When a server component needs interactive subtree (e.g. hero actions including trailer modal), group it in a single client component like [components/kage/hero-actions.tsx](components/kage/hero-actions.tsx) rather than scattering `"use client"` files.

### Routing surface

13 routes. Beyond what's in the README: `/mylist` (static client shell, reads zustand), `/profile` (settings/export/import, reads both stores), `/sitemap.xml` (rebuilds daily with top ~200 anime URLs from Shikimori, falls back to just static routes on failure), `/robots.txt`.

### SEO

[lib/site.ts](lib/site.ts) centralizes `SITE_URL` (from `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` / localhost fallback). The detail page emits JSON-LD `TVSeries` schema inline and full `openGraph: video.tv_show` + `twitter:summary_large_image` metadata. There is no dynamic OG-image renderer yet.

### CommandPalette

`⌘K` / `Ctrl+K` opens [components/kage/command-palette.tsx](components/kage/command-palette.tsx). It combines four groups: library (zustand), recent (Dexie), live Shikimori search via `/api/search`, and quick actions. The header [components/layout/search-box.tsx](components/layout/search-box.tsx) is just the trigger button — it intentionally does no searching itself anymore.

## Planning workflow

The current improvement plan lives at `C:\Users\admin\.claude\plans\typed-gathering-dawn.md` and tracks completed/pending tiers. When picking up work, read it first — what's marked done corresponds to existing code; what's not is fair game. The plan is the source of truth for "what to build next," not this file.

## Gotchas

- **`writingMode` must be `"vertical-rl"` in TS**, not `"tb"` — the looser value isn't in the React CSS types ([components/kage/poster.tsx](components/kage/poster.tsx)).
- **pnpm-workspace.yaml `allowBuilds`** ([pnpm-workspace.yaml](pnpm-workspace.yaml)) — postinstall scripts are blocked by default. If you add a dep that needs to build (e.g. sharp), add it to that allow-map.
- **PowerShell quirks** when calling external tools via Bash/PowerShell: pipes write to stderr → tool-shell shows them as errors even on success. Treat exit code as truth, not stderr presence.
- **Next.js `loading.tsx` is already wired** for `/`, `/catalog`, `/anime/[id]`, `/anime/[id]/watch` — they import from [components/kage/skeletons.tsx](components/kage/skeletons.tsx) (`HeroSkeleton`, `RailSkeleton`, `PosterGridSkeleton`). Match that vocabulary instead of building new skeletons.

# KAGE 影 — учебный онлайн-кинотеатр аниме

Тёмный кинематографичный стриминг на **Next.js 16 + Tailwind v4**. Каталог
тянет данные с **Shikimori GraphQL**, видео встраивается через **Kodik**
(работает «из коробки», без токена) и опционально **Alloha**.

Дизайн-система **KAGE 影** перенесена из бандла Claude Design.

## Стек

- Next.js 16 (App Router, Turbopack) + TypeScript 5 + React 19
- Tailwind CSS v4 (CSS-first конфиг, `@theme`)
- shadcn/ui (вариант `base-nova`) + `class-variance-authority` + `tailwind-merge`
- GraphQL: `graphql-request` + `zod` (валидация ответа)
- Шрифты: **Playfair Display** (italic-serif заголовки), **Space Grotesk** + **Manrope** (UI), **Noto Sans JP** (японский)

## Запуск

```powershell
# 1. зависимости (pnpm 10+)
pnpm install

# 2. переменные окружения (опциональные — есть рабочие дефолты)
Copy-Item .env.example .env.local

# 3. dev-сервер
pnpm dev
# → http://localhost:3000
```

## Переменные окружения (`.env.local`)

Все опциональные. Без них сайт работает (Kodik подцепляет токен сам, Alloha остаётся «недоступно»).

| Переменная | Назначение | Дефолт |
|---|---|---|
| `SHIKIMORI_API_URL` | GraphQL-эндпоинт Shikimori | `https://shikimori.io/api/graphql` |
| `SHIKIMORI_USER_AGENT` | Обязательный заголовок для Shikimori | `KAGE/1.0 (anime catalog)` |
| `KODIK_TOKEN` | Свой зарегистрированный токен Kodik. Если не задан — берётся публичный токен из скрипта плеера автоматически. | _(пусто, авто)_ |
| `KODIK_API_HOST` | Хост Kodik | `https://kodik-api.com` |
| `ALLOHA_TOKEN` | Токен Alloha (`alloha.tv`). Без него вкладка Alloha будет «недоступно». | _(пусто)_ |

> **Про Kodik.** Классический хост `kodikapi.com` мёртв (нет DNS-записи). Живой
> API — `kodik-api.com`. Его `/search` требует зарегистрированный токен, но
> `/get-player?shikimoriID=…` принимает публичный токен из скрипта плеера
> (`kodik-add.com/add-players.min.js`) и возвращает готовую iframe-ссылку — этим
> и пользуемся. См. [lib/kodik/client.ts](lib/kodik/client.ts).
>
> **Про Alloha.** Токены выдают только сайтам с трафиком 1000+/день
> (`alloha.tv`). Для pet-проекта недоступно — вкладка остаётся декоративной.

## Структура

```
app/
  page.tsx                 # главная: hero + 4 рельса (тренд / сезон / топ / анонсы)
  catalog/                 # /catalog — фильтры по URL-параметрам, SSR
  anime/[id]/              # /anime/[id] — деталь (KAGE-hero, табы)
  anime/[id]/watch/        # /anime/[id]/watch — плеер с переключателем
  api/
    search/                # /api/search?q=… — подсказки для хедера
    kodik/search/          # прокси к Kodik (скрывает токен)
    alloha/search/         # прокси к Alloha
  icon.svg, not-found.tsx, error.tsx
components/
  kage/                    # дизайн-система KAGE (poster, backdrop, rail, rating, …)
  layout/                  # header (с живым поиском), footer, logo, search-box
  ui/                      # shadcn-ui примитивы (button, input, skeleton)
lib/
  shikimori/               # GraphQL-клиент, запросы, zod-схемы, API-функции
  anime/                   # модель Anime + маппинг Shikimori → Anime
  kodik/, alloha/          # серверные клиенты плееров
```

## Маршруты

| URL | Тип | Назначение |
|---|---|---|
| `/` | static (ISR 5 мин) | главная: hero + горизонтальные рельсы |
| `/catalog` | dynamic | каталог: поиск, фильтр жанра, сортировка, пагинация |
| `/anime/[id]` | dynamic | деталь: hero, синопсис, мета, вкладки (Эпизоды/Описание/Похожее) |
| `/anime/[id]/watch?ep=N` | dynamic | плеер с переключателем Kodik/Alloha |
| `/api/search?q=…` | dynamic | подсказки для хедера |
| `/api/kodik/search`, `/api/alloha/search` | dynamic | серверные прокси к плеерам |

## Производственная сборка

```powershell
pnpm build   # турбосборка + типы + статическая генерация
pnpm start   # запуск собранного приложения
```

## Известные ограничения

- Без авторизации/«моих списков»/истории — учебный MVP.
- Эпизоды генерируются по счётчику Shikimori (там нет названий серий).
- Постеры Shikimori вертикальные 2:3, для hero/превью-эпизодов используется
  стилизованный SVG-градиент по палитре (вместо обрезанного постера).
- Это **pet-проект для учебных целей**, не для коммерческого использования.
  Данные предоставляются Shikimori, видео — внешними плеерами.

## Лицензия / атрибуция

- Данные: [Shikimori](https://shikimori.io) (соблюдайте их условия + rate limit).
- Видео: Kodik, Alloha (плеер встраивается iframe-ом, контент не хранится).
- Дизайн: бандл «KAGE 影» из Claude Design.

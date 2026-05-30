"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mic2,
  MonitorPlay,
  Play,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Anime } from "@/lib/anime/types";
import { useSettingsStore } from "@/lib/store/settings";
import { useHydrated } from "@/lib/store/use-hydrated";
import { useWatchedEpisodes } from "@/lib/db/hooks";
import { SkipOverlay } from "@/components/kage/skip-overlay";
import { WatchProgressWriter } from "@/components/kage/watch-progress-writer";
import { withEpisode, withStart, withHiddenSelectors } from "@/lib/kodik/client";
import type { PlayerTab } from "@/components/kage/player-switcher";

interface EmbeddedPlayerProps {
  anime: Anime;
  tabs: PlayerTab[];
  episodes: number[];
  episodesAired: number;
  initialEpisode: number;
  startSeconds?: number | null;
  episodeDuration?: number | null;
}

/**
 * Встроенный плеер на странице аниме (полированный KAGE-стиль):
 *  • кадр плеера слева + панель озвучки справа (поиск + список студий);
 *  • под плеером — бар управления (источник сегмент-контролом + prev/next серии);
 *  • ниже — секция «Серии» с пилюлями и быстрым переходом по номеру.
 *
 * Серия — клиентский state: клик → iframe ремаунтится (Kodik не принимает
 * postMessage снаружи). Озвучка переживает ремаунт, т.к. baseSrc берётся из
 * активной KAGE-озвучки (zustand), а не из UI Kodik.
 */
export function EmbeddedPlayer({
  anime,
  tabs,
  episodes,
  episodesAired,
  initialEpisode,
  startSeconds,
  episodeDuration,
}: EmbeddedPlayerProps) {
  const hydrated = useHydrated();
  const preferredPlayer = useSettingsStore((s) => s.preferredPlayer);
  const skipOpening = useSettingsStore((s) => s.skipOpening);
  const autoNext = useSettingsStore((s) => s.autoNext);
  const savedTranslationId = useSettingsStore(
    (s) => s.translationByAnime[anime.id],
  );
  const setTranslation = useSettingsStore((s) => s.setTranslationForAnime);

  const watched = useWatchedEpisodes(anime.id);
  const watchedSet = useMemo(() => new Set(watched), [watched]);

  // --- Активный плеер (Kodik / Alloha) ---
  const initialTab = (() => {
    if (preferredPlayer === "kodik" || preferredPlayer === "alloha") {
      const preferred = tabs.find((t) => t.id === preferredPlayer && t.available);
      if (preferred) return preferred.id;
    }
    return tabs.find((t) => t.available)?.id ?? tabs[0]?.id;
  })();
  const [active, setActive] = useState(initialTab);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  // --- Серия (клиентский state) ---
  const [episode, setEpisode] = useState(initialEpisode);
  const [touched, setTouched] = useState(false);
  const effectiveStart = !touched ? (startSeconds ?? 0) : 0;

  const changeEpisode = (num: number) => {
    if (num < 1 || num > episodes.length) return;
    setTouched(true);
    setEpisode(num);
  };

  const lastAired = Math.max(episodesAired, 1);
  const canPrev = episode > 1;
  const canNext = episode < Math.min(episodes.length, lastAired);

  // --- Озвучка ---
  const translations = useMemo(() => current?.translations ?? [], [current]);
  const activeTranslation = useMemo(() => {
    if (!translations.length) return null;
    const saved = translations.find((t) => t.id === savedTranslationId);
    return saved ?? translations[0]!;
  }, [translations, savedTranslationId]);

  const [dubQuery, setDubQuery] = useState("");
  const filteredTranslations = useMemo(() => {
    const q = dubQuery.trim().toLowerCase();
    if (!q) return translations;
    return translations.filter((t) => t.title.toLowerCase().includes(q));
  }, [translations, dubQuery]);

  // Kodik шлёт postMessage когда юзер внутри iframe меняет озвучку — ловим в zustand.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const raw = e.data as unknown;
      if (!raw || typeof raw !== "object") return;
      const data = raw as { key?: string; value?: unknown };
      if (typeof data.key !== "string") return;
      if (!data.key.startsWith("kodik_player")) return;
      if (/translation|voice|dub/i.test(data.key)) {
        const v = data.value as
          | number
          | string
          | { id?: number | string; translation?: { id?: number | string } }
          | undefined;
        let id: number | undefined;
        if (typeof v === "number") id = v;
        else if (typeof v === "string" && /^\d+$/.test(v)) id = Number(v);
        else if (v && typeof v === "object") {
          const rawId = v.id ?? v.translation?.id;
          if (typeof rawId === "number") id = rawId;
          else if (typeof rawId === "string" && /^\d+$/.test(rawId)) id = Number(rawId);
        }
        if (typeof id === "number" && !Number.isNaN(id)) {
          setTranslation(anime.id, id);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [anime.id, setTranslation]);

  const baseSrc = activeTranslation?.src ?? current?.src;
  const sourceKey = `${current?.id ?? "none"}-${activeTranslation?.id ?? "default"}`;

  const iframeSrc = useMemo(() => {
    if (!baseSrc) return undefined;
    let src = withEpisode(baseSrc, episode);
    // Есть свой список озвучек (правая панель пишет в zustand) → прячем нативный
    // селектор Kodik. Тогда озвучка выбирается только у нас и ПЕРЕЖИВАЕТ смену
    // серии. Нет списка → оставляем нативный Kodik (иначе озвучку негде выбрать).
    if (translations.length > 1) src = withHiddenSelectors(src);
    if (effectiveStart && effectiveStart > 5) src = withStart(src, effectiveStart);
    return src;
  }, [baseSrc, episode, effectiveStart, translations.length]);

  const showDubPanel = hydrated && translations.length > 1;
  const playable = current?.available && iframeSrc;

  return (
    <section id="player" className="mx-auto max-w-[1280px] scroll-mt-24 2xl:max-w-[1440px]">
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
          <Play className="size-3.5" fill="currentColor" strokeWidth={0} />
        </span>
        <h2 className="font-display text-[clamp(1.15rem,2vw,1.55rem)] text-foreground">
          Смотреть онлайн
        </h2>
        {episodes.length > 0 && (
          <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-text-dim">
            {episodesAired > 0 ? `${episodesAired} / ` : ""}
            {episodes.length} эп.
          </span>
        )}
      </header>

      <div
        className={cn(
          "grid gap-3",
          showDubPanel
            ? "lg:grid-cols-[minmax(0,1fr)_clamp(280px,24vw,344px)]"
            : "lg:grid-cols-1",
        )}
      >
        {/* КАДР ПЛЕЕРА */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl shadow-black/50 ring-1 ring-white/[0.04]">
          {playable ? (
            <iframe
              key={`${sourceKey}-${episode}`}
              src={iframeSrc}
              title={`Плеер ${current?.label}`}
              className="absolute inset-0 size-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <UnavailableState />
          )}
          {hydrated && playable && (
            <SkipOverlay
              key={`overlay-${sourceKey}-${episode}`}
              episodeDuration={episodeDuration ?? null}
              nextEpHref={null}
              skipOpening={skipOpening}
              autoNext={autoNext}
            />
          )}
        </div>

        {/* ПАНЕЛЬ ОЗВУЧКИ */}
        {showDubPanel && activeTranslation && (
          <aside className="relative min-h-[280px] lg:min-h-0">
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface/50 p-2.5 backdrop-blur-sm lg:absolute lg:inset-0">
              <div className="flex items-center gap-2 px-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-dim">
                <Mic2 className="size-3.5 text-brand" />
                Озвучка
                <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-foreground">
                  {translations.length}
                </span>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-mute" />
                <input
                  type="text"
                  value={dubQuery}
                  onChange={(e) => setDubQuery(e.target.value)}
                  placeholder="Поиск студии…"
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-text-mute focus:border-brand/60 focus:outline-none"
                  aria-label="Поиск студии"
                />
              </div>

              <div className="no-scrollbar -mr-1 flex max-h-[260px] flex-col gap-1 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
                {filteredTranslations.map((t) => {
                  const isActive = t.id === activeTranslation.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTranslation(anime.id, t.id)}
                      className={cn(
                        "group flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all",
                        isActive
                          ? "bg-brand font-medium text-white shadow-lg shadow-brand/25"
                          : "text-text-dim hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      <span className="line-clamp-1 flex-1">{t.title}</span>
                      {t.type === "subtitles" && (
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                            isActive ? "bg-white/20 text-white" : "bg-surface text-text-mute",
                          )}
                        >
                          суб
                        </span>
                      )}
                      {isActive && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
                {filteredTranslations.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-text-mute">
                    Студия не найдена
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* БАР УПРАВЛЕНИЯ */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 p-2">
        <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!t.available}
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active === t.id && t.available
                  ? "bg-brand text-white shadow-sm"
                  : t.available
                    ? "text-text-dim hover:text-foreground"
                    : "cursor-not-allowed text-text-mute/60",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <StepButton
            dir="prev"
            disabled={!canPrev}
            onClick={() => changeEpisode(episode - 1)}
          />
          <span className="min-w-[92px] text-center text-[13px] font-medium text-foreground tabular-nums">
            Эпизод {episode}
          </span>
          <StepButton
            dir="next"
            disabled={!canNext}
            onClick={() => changeEpisode(episode + 1)}
          />
        </div>
      </div>

      {/* СЕРИИ */}
      {episodes.length > 1 && (
        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-dim">
              Серии
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-mute">
                {episodes.length}
              </span>
            </h3>
            <JumpInput max={episodes.length} onJump={changeEpisode} />
          </div>
          <EpisodeGrid
            episodes={episodes}
            episodesAired={episodesAired}
            current={episode}
            watchedSet={watchedSet}
            onSelect={changeEpisode}
          />
        </div>
      )}

      <WatchProgressWriter anime={anime} episode={episode} />

      <p className="mt-4 text-xs text-text-mute">
        Видео предоставляется внешними плеерами Kodik и Alloha. KAGE не хранит и
        не раздаёт контент.
      </p>
    </section>
  );
}

function StepButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "prev" ? "Предыдущая серия" : "Следующая серия"}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-foreground transition-colors",
        disabled
          ? "cursor-not-allowed text-text-mute/50"
          : "hover:border-brand/50 hover:text-brand",
      )}
    >
      <Icon className="size-[1.15rem]" />
    </button>
  );
}

function EpisodeGrid({
  episodes,
  episodesAired,
  current,
  watchedSet,
  onSelect,
}: {
  episodes: number[];
  episodesAired: number;
  current: number;
  watchedSet: Set<number>;
  onSelect: (num: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // Центрируем активную серию ТОЛЬКО по горизонтали внутри ленты — меняем
  // scrollLeft контейнера, а не вызываем scrollIntoView (тот скроллил бы всю
  // страницу вниз к ленте при загрузке).
  useEffect(() => {
    const el = scrollRef.current;
    const active = activeRef.current;
    if (!el || !active) return;
    const elRect = el.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    el.scrollLeft += aRect.left - elRect.left - el.clientWidth / 2 + aRect.width / 2;
  }, [current]);

  // Вертикальное колесо мыши прокручивает ленту вбок (удобно на десктопе).
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.deltaY === 0) return;
    el.scrollLeft += e.deltaY;
  };

  // Drag-to-scroll: зажал и тянешь ленту. БЕЗ pointer capture — иначе клики
  // по сериям перехватываются контейнером и не доходят до кнопок. Move/up
  // слушаем на window, чтобы перетаскивание не рвалось при выходе курсора.
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const el = scrollRef.current;
      if (!el || !drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.startScroll - dx;
    };
    const onUp = () => {
      drag.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0 || e.pointerType === "touch") return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  return (
    <div
      ref={scrollRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      className="no-scrollbar cursor-grab select-none overflow-x-auto rounded-2xl border border-border bg-surface/30 p-2.5 active:cursor-grabbing"
    >
      <div className="flex w-max gap-2">
        {episodes.map((num) => {
          const isActive = num === current;
          const isAired = num <= episodesAired;
          const isWatched = watchedSet.has(num);
          return (
            <button
              key={num}
              ref={isActive ? activeRef : undefined}
              type="button"
              disabled={!isAired}
              onClick={() => {
                // Не выбирать серию, если это было перетаскивание, а не клик.
                if (drag.current.moved) return;
                onSelect(num);
              }}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "relative flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-all",
                isActive
                  ? "bg-brand text-white shadow-lg shadow-brand/25"
                  : !isAired
                    ? "cursor-not-allowed border border-dashed border-border text-text-mute/60"
                    : isWatched
                      ? "border border-border bg-surface-2 text-text-dim hover:text-foreground"
                      : "border border-border bg-surface-2 text-foreground hover:border-brand/50 hover:-translate-y-0.5",
              )}
            >
              {num}
              {isWatched && !isActive && isAired && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand text-white ring-2 ring-background">
                  <Check className="size-2.5" strokeWidth={4} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JumpInput({
  max,
  onJump,
}: {
  max: number;
  onJump: (num: number) => void;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= max) onJump(n);
    setValue("");
  };
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2">
      <span className="text-xs text-text-mute">№</span>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        onBlur={submit}
        placeholder="…"
        className="h-8 w-14 bg-transparent text-center text-[13px] text-foreground placeholder:text-text-mute focus:outline-none"
        aria-label="Перейти к серии"
      />
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <MonitorPlay className="size-10 text-text-mute" />
      <p className="font-display text-xl text-foreground">Источник недоступен</p>
      <p className="max-w-md text-sm text-text-dim">
        Для этого тайтла нет видео в выбранном плеере — попробуйте другую вкладку.
      </p>
    </div>
  );
}

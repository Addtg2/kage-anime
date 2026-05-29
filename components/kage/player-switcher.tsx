"use client";

import { useEffect, useMemo, useState } from "react";
import { MonitorPlay, Mic2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settings";
import { useHydrated } from "@/lib/store/use-hydrated";
import { SkipOverlay } from "@/components/kage/skip-overlay";
import { withEpisode, withStart } from "@/lib/kodik/client";

export interface PlayerTranslation {
  id: number;
  title: string;
  type: string;
  src: string;
}

export interface PlayerTab {
  id: "kodik" | "alloha";
  label: string;
  available: boolean;
  src?: string;
  translations?: PlayerTranslation[];
}

interface PlayerSwitcherProps {
  animeId: string;
  tabs: PlayerTab[];
  /** Стартовая серия — запекается в URL iframe только при mount / смене источника или озвучки. */
  initialEpisode?: number;
  episodeDuration?: number | null;
  /** Стартовая позиция в секундах (G1) — приходит из ?start= */
  startSeconds?: number | null;
}

export function PlayerSwitcher({
  animeId,
  tabs,
  initialEpisode,
  episodeDuration,
  startSeconds,
}: PlayerSwitcherProps) {
  const hydrated = useHydrated();
  const preferredPlayer = useSettingsStore((s) => s.preferredPlayer);
  const skipOpening = useSettingsStore((s) => s.skipOpening);
  const autoNext = useSettingsStore((s) => s.autoNext);
  const savedTranslationId = useSettingsStore(
    (s) => s.translationByAnime[animeId],
  );
  const setTranslation = useSettingsStore((s) => s.setTranslationForAnime);

  const initial = (() => {
    if (preferredPlayer === "kodik" || preferredPlayer === "alloha") {
      const preferred = tabs.find((t) => t.id === preferredPlayer && t.available);
      if (preferred) return preferred.id;
    }
    return tabs.find((t) => t.available)?.id ?? tabs[0]?.id;
  })();
  const [active, setActive] = useState(initial);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const translations = current?.translations ?? [];
  const activeTranslation = useMemo(() => {
    if (!translations.length) return null;
    const saved = translations.find((t) => t.id === savedTranslationId);
    return saved ?? translations[0]!;
  }, [translations, savedTranslationId]);

  // Kodik шлёт postMessage когда юзер внутри iframe меняет озвучку.
  // Ловим и пишем в zustand, чтобы выбор переживал навигацию по сериям из бокового пикера.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const raw = e.data as unknown;
      if (!raw || typeof raw !== "object") return;
      const data = raw as { key?: string; value?: unknown };
      if (typeof data.key !== "string") return;
      if (!data.key.startsWith("kodik_player")) return;

      // Смена озвучки: пытаемся любое разумное имя ключа + любой формат значения.
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
          setTranslation(animeId, id);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [animeId, setTranslation]);

  const epNum = initialEpisode ?? 1;
  const baseSrc = activeTranslation?.src ?? current?.src;
  const sourceKey = `${current?.id ?? "none"}-${activeTranslation?.id ?? "default"}`;

  // iframe-URL пересчитывается при смене источника/озвучки ИЛИ при внешней
  // навигации с другим `?ep=` (deep-link с детальной страницы). Внутри iframe
  // URL `/watch` не меняется — поэтому смена серии встроенным UI Kodik сюда
  // не приходит и iframe не ремаунтится, выбранная озвучка не сбрасывается.
  const iframeSrc = useMemo(() => {
    if (!baseSrc) return undefined;
    const withEp = withEpisode(baseSrc, epNum);
    return startSeconds && startSeconds > 5 ? withStart(withEp, startSeconds) : withEp;
  }, [baseSrc, epNum, startSeconds]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.available}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
              active === t.id && t.available
                ? "border-brand bg-brand text-white"
                : t.available
                  ? "border-border bg-surface-2 text-text-dim hover:text-foreground"
                  : "cursor-not-allowed border-border bg-surface text-text-mute",
            )}
          >
            {t.label}
            {!t.available && " · недоступно"}
          </button>
        ))}

        {hydrated && translations.length > 1 && activeTranslation && (
          <label className="ml-auto flex items-center gap-2 text-[12px] text-text-dim">
            <Mic2 className="size-3.5" />
            <span className="sr-only">Озвучка</span>
            <select
              value={activeTranslation.id}
              onChange={(e) => setTranslation(animeId, Number(e.target.value))}
              className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-surface px-3 pr-7 text-xs text-foreground transition-colors hover:border-border-hi focus:outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "calc(100% - 8px) center",
              }}
              aria-label="Озвучка"
            >
              {translations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.type === "subtitles" ? " (суб)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {current?.available && iframeSrc ? (
          <iframe
            key={`${sourceKey}-${epNum}`}
            src={iframeSrc}
            title={`Плеер ${current.label}`}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <UnavailableState />
        )}
        {hydrated && current?.available && iframeSrc && (
          <SkipOverlay
            key={`overlay-${sourceKey}`}
            episodeDuration={episodeDuration ?? null}
            nextEpHref={null}
            skipOpening={skipOpening}
            autoNext={autoNext}
          />
        )}
      </div>
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
        Alloha требует токен{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand-2">ALLOHA_TOKEN</code>{" "}
        в <code className="rounded bg-surface-2 px-1.5 py-0.5">.env.local</code>.
      </p>
    </div>
  );
}

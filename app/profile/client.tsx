"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  History,
  LogIn,
  QrCode,
  Trash2,
  Upload,
  User,
  X as XIcon,
} from "lucide-react";
import { z } from "zod";
import QRCode from "qrcode";
import { toast } from "sonner";
import * as Switch from "@radix-ui/react-switch";

import {
  useSettingsStore,
  type PreferredPlayer,
  type Theme,
} from "@/lib/store/settings";
import { useLibraryStore } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { clearHistory, db } from "@/lib/db/dexie";
import { useResume } from "@/lib/db/hooks";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { ProfileStats } from "@/components/kage/profile-stats";
import { cn } from "@/lib/utils";

const LibraryEntrySchema = z.object({
  status: z.enum(["watching", "planned", "completed", "dropped"]),
  addedAt: z.number(),
  anime: z.object({ id: z.string(), titleRu: z.string() }).passthrough(),
});

const HistoryRowSchema = z.object({
  animeId: z.string(),
  episode: z.number(),
  updatedAt: z.number(),
  anime: z.unknown(),
});

const EpisodeSubSchema = z.object({
  animeId: z.string(),
  titleRu: z.string(),
  nextAt: z.string(),
  nextEpisode: z.number(),
});

const ImportSchema = z.object({
  version: z.number().optional(),
  library: z.array(LibraryEntrySchema).optional(),
  history: z.array(HistoryRowSchema).optional(),
  settings: z.object({
    preferredPlayer: z.enum(["auto", "kodik", "alloha"]).optional(),
    theme: z.enum(["dark", "oled", "light"]).optional(),
    autoNext: z.boolean().optional(),
    spoilerFree: z.boolean().optional(),
    translationByAnime: z.record(z.string(), z.number()).optional(),
    episodeSubs: z.record(z.string(), EpisodeSubSchema).optional(),
  }).optional(),
});

const THEME_OPTIONS: { id: Theme; label: string; desc: string }[] = [
  { id: "dark", label: "Тёмная", desc: "Кинематографичный тёмный интерфейс" },
  { id: "oled", label: "OLED", desc: "Чистый чёрный фон для OLED-экранов" },
  { id: "light", label: "Светлая", desc: "Белый фон, тёмный текст" },
];

const PLAYER_OPTIONS: { id: PreferredPlayer; label: string; desc: string }[] = [
  { id: "auto", label: "Авто", desc: "Доступный источник выбирается сам" },
  { id: "kodik", label: "Kodik", desc: "Больше озвучек, есть субтитры" },
  { id: "alloha", label: "Alloha", desc: "Иногда есть оригинальное качество" },
];

export function ProfileClient() {
  const hydrated = useHydrated();
  const preferredPlayer = useSettingsStore((s) => s.preferredPlayer);
  const setPreferredPlayer = useSettingsStore((s) => s.setPreferredPlayer);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const autoNext = useSettingsStore((s) => s.autoNext);
  const setAutoNext = useSettingsStore((s) => s.setAutoNext);
  const spoilerFree = useSettingsStore((s) => s.spoilerFree);
  const setSpoilerFree = useSettingsStore((s) => s.setSpoilerFree);
  const entries = useLibraryStore((s) => s.entries);
  const clearLibrary = useLibraryStore((s) => s.clear);
  const resume = useResume(1000);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<"library" | "history" | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const libraryCount = useMemo(
    () => (hydrated ? Object.keys(entries).length : 0),
    [entries, hydrated],
  );
  const historyCount = useMemo(
    () => (resume ? resume.length : 0),
    [resume],
  );

  const flashError = (m: string) => toast.error(m);
  const flashSuccess = (m: string) => toast.success(m);

  function buildExportPayload(history: unknown[]) {
    const s = useSettingsStore.getState();
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      library: Object.values(entries),
      history,
      settings: {
        preferredPlayer: s.preferredPlayer,
        theme: s.theme,
        autoNext: s.autoNext,
        spoilerFree: s.spoilerFree,
        translationByAnime: s.translationByAnime,
        episodeSubs: s.episodeSubs,
      },
    };
  }

  async function exportData() {
    const d = db();
    const history = d ? await d.history.toArray() : [];
    const payload = buildExportPayload(history);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kage-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashSuccess("Экспортировано");
  }

  async function generateQR() {
    const d = db();
    const history = d ? await d.history.toArray() : [];
    const payload = buildExportPayload(history);
    const json = JSON.stringify(payload);
    if (json.length > 2953) {
      flashError("Данных слишком много для QR-кода (уменьшите список)");
      return;
    }
    try {
      const url = await QRCode.toDataURL(json, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrUrl(url);
      setQrOpen(true);
    } catch {
      flashError("Не удалось создать QR-код");
    }
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const result = ImportSchema.safeParse(raw);
      if (!result.success) {
        flashError("Ошибка импорта — неверный формат файла");
        return;
      }
      const data = result.data;
      const setStatus = useLibraryStore.getState().setStatus;
      const d = db();
      let imported = 0;

      if (data.library) {
        for (const e of data.library) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setStatus(e.anime as any, e.status);
          imported += 1;
        }
      }

      if (d && data.history) {
        for (const row of data.history) {
          if (row.animeId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await d.history.put(row as any);
          }
        }
      }

      // v2: restore settings (skip for v1 which has no settings key)
      if (data.settings) {
        const s = data.settings;
        const store = useSettingsStore.getState();
        if (s.preferredPlayer) store.setPreferredPlayer(s.preferredPlayer);
        if (s.theme) store.setTheme(s.theme);
        if (s.autoNext !== undefined) store.setAutoNext(s.autoNext);
        if (s.spoilerFree !== undefined) store.setSpoilerFree(s.spoilerFree);
        if (s.translationByAnime) useSettingsStore.setState({ translationByAnime: s.translationByAnime });
        if (s.episodeSubs) useSettingsStore.setState({ episodeSubs: s.episodeSubs });
      }

      flashSuccess(`Импортировано: ${imported} тайтлов`);
    } catch (e) {
      console.error(e);
      flashError("Ошибка импорта — проверьте файл");
    }
  }

  function confirmClearLibrary() {
    setDialog("library");
  }

  function confirmClearHistory() {
    setDialog("history");
  }

  return (
    <div className="mx-auto max-w-3xl py-[clamp(1.5rem,3vw,2.5rem)] px-[clamp(1rem,4vw,2.5rem)]">
      <div className="mb-8 flex items-center gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--brand), var(--brand-2))",
          }}
        >
          <User className="size-7" />
        </div>
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-none">
            Профиль
          </h1>
          <p className="mt-1 text-sm text-text-dim">
            Все настройки и данные хранятся локально в браузере
          </p>
        </div>
      </div>

      <Section title="Аккаунт">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          <div>
            <div className="font-medium text-foreground">Войти через Shikimori</div>
            <div className="text-xs text-text-dim">
              Скоро — синхронизация списка и оценок
            </div>
          </div>
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "cursor-not-allowed opacity-60",
            )}
          >
            <LogIn className="size-3.5" />
            Скоро
          </button>
        </div>
      </Section>

      <Section title="Внешний вид">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map((t) => {
            const active = hydrated && theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-brand bg-surface text-foreground"
                    : "border-border bg-surface/50 text-text-dim hover:border-border-hi hover:text-foreground",
                )}
              >
                <div className="font-medium">{t.label}</div>
                <div className="mt-1 text-[11px] leading-snug">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Плеер по умолчанию">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PLAYER_OPTIONS.map((p) => {
            const active = hydrated && preferredPlayer === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreferredPlayer(p.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-brand bg-surface text-foreground"
                    : "border-border bg-surface/50 text-text-dim hover:border-border-hi hover:text-foreground",
                )}
              >
                <div className="font-medium">{p.label}</div>
                <div className="mt-1 text-[11px] leading-snug">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Воспроизведение">
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Автопереход к следующей серии"
            description="Включать следующую серию после окончания текущей"
            checked={hydrated && autoNext}
            onChange={setAutoNext}
          />
          <ToggleRow
            label="Режим без спойлеров"
            description="Скрывает синопсис и названия непросмотренных эпизодов"
            checked={hydrated && spoilerFree}
            onChange={setSpoilerFree}
          />
        </div>
      </Section>

      <Section title="Статистика">
        <ProfileStats />
      </Section>

      <Section title="Ваши данные">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="В списке" value={hydrated ? libraryCount : "—"} />
          <Stat label="В истории" value={resume ? historyCount : "—"} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link
            href="/history"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            <History />
            История
          </Link>
          <button
            type="button"
            onClick={exportData}
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            <Download />
            Экспорт JSON
          </button>
          <button
            type="button"
            onClick={generateQR}
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            <QrCode />
            QR
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            <Upload />
            Импорт
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-text-dim">
          Импорт принимает файл .json из приложения «Файлы».
        </p>
      </Section>

      <Section title="Опасная зона">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface/50 p-4">
          <button
            type="button"
            onClick={confirmClearLibrary}
            disabled={!hydrated || libraryCount === 0}
            className={cn(
              "flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Trash2 className="size-4 text-brand" />
              Очистить «Моё»
            </span>
            <AlertTriangle className="size-4 text-text-dim" />
          </button>
          <button
            type="button"
            onClick={confirmClearHistory}
            disabled={historyCount === 0}
            className={cn(
              "flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Trash2 className="size-4 text-brand" />
              Очистить историю
            </span>
            <AlertTriangle className="size-4 text-text-dim" />
          </button>
        </div>
      </Section>
      <ConfirmDialog
        open={dialog === "library"}
        onOpenChange={(v) => !v && setDialog(null)}
        title={`Удалить все ${libraryCount} тайтлов из списка?`}
        description="Это действие нельзя отменить."
        confirmLabel="Очистить"
        destructive
        onConfirm={() => { clearLibrary(); flashSuccess("Список очищен"); setDialog(null); }}
      />
      <ConfirmDialog
        open={dialog === "history"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Очистить историю просмотров?"
        description="Это действие нельзя отменить."
        confirmLabel="Очистить"
        destructive
        onConfirm={() => { clearHistory(); flashSuccess("История очищена"); setDialog(null); }}
      />

      {qrOpen && qrUrl && (
        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="relative rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label="Закрыть"
              className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:text-gray-700"
            >
              <XIcon className="size-5" />
            </button>
            <p className="mb-4 text-center text-sm font-medium text-gray-700">
              Отсканируй на другом устройстве для импорта
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR-код экспорта"
              width={224}
              height={224}
              className="size-56 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `toggle-${label.replace(/\s+/g, "-")}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-hi"
    >
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-text-dim">{description}</div>
      </div>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          "data-[state=checked]:bg-brand",
          "data-[state=unchecked]:border data-[state=unchecked]:border-border data-[state=unchecked]:bg-surface-2",
        )}
      >
        <Switch.Thumb
          className={cn(
            "block size-5 rounded-full bg-white shadow-sm transition-transform",
            "translate-x-0.5 data-[state=checked]:translate-x-[22px]",
          )}
        />
      </Switch.Root>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-dim">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl text-foreground">{value}</div>
    </div>
  );
}

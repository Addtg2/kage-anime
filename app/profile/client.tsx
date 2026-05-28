"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  LogIn,
  Trash2,
  Upload,
  User,
} from "lucide-react";

import {
  useSettingsStore,
  type PreferredPlayer,
} from "@/lib/store/settings";
import { useLibraryStore } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { clearHistory, db } from "@/lib/db/dexie";
import { useResume } from "@/lib/db/hooks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLAYER_OPTIONS: { id: PreferredPlayer; label: string; desc: string }[] = [
  { id: "auto", label: "Авто", desc: "Доступный источник выбирается сам" },
  { id: "kodik", label: "Kodik", desc: "Больше озвучек, есть субтитры" },
  { id: "alloha", label: "Alloha", desc: "Иногда есть оригинальное качество" },
];

export function ProfileClient() {
  const hydrated = useHydrated();
  const preferredPlayer = useSettingsStore((s) => s.preferredPlayer);
  const setPreferredPlayer = useSettingsStore((s) => s.setPreferredPlayer);
  const entries = useLibraryStore((s) => s.entries);
  const clearLibrary = useLibraryStore((s) => s.clear);
  const resume = useResume(1000);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const libraryCount = useMemo(
    () => (hydrated ? Object.keys(entries).length : 0),
    [entries, hydrated],
  );
  const historyCount = useMemo(
    () => (resume ? resume.length : 0),
    [resume],
  );

  const flash = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 3000);
  };

  async function exportData() {
    const d = db();
    const history = d ? await d.history.toArray() : [];
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      library: Object.values(entries),
      history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kage-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Экспортировано");
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        library?: { anime: unknown; status: string; addedAt: number }[];
        history?: { animeId: string; anime: unknown; episode: number; updatedAt: number }[];
      };
      const setStatus = useLibraryStore.getState().setStatus;
      const d = db();
      let imported = 0;
      if (Array.isArray(data.library)) {
        for (const e of data.library) {
          if (e && typeof e === "object" && "anime" in e && "status" in e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStatus(e.anime as any, e.status as any);
            imported += 1;
          }
        }
      }
      if (d && Array.isArray(data.history)) {
        for (const row of data.history) {
          if (row?.animeId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await d.history.put(row as any);
          }
        }
      }
      flash(`Импортировано: ${imported} тайтлов`);
    } catch (e) {
      console.error(e);
      flash("Ошибка импорта — проверьте файл");
    }
  }

  function confirmClearLibrary() {
    if (window.confirm(`Удалить все ${libraryCount} тайтлов из списка?`)) {
      clearLibrary();
      flash("Список очищен");
    }
  }

  function confirmClearHistory() {
    if (window.confirm("Очистить историю просмотров?")) {
      clearHistory();
      flash("История очищена");
    }
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

      {message && (
        <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground">
          {message}
        </div>
      )}

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

      <Section title="Плеер по умолчанию">
        <div className="grid gap-2 sm:grid-cols-3">
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

      <Section title="Ваши данные">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="В списке" value={hydrated ? libraryCount : "—"} />
          <Stat label="В истории" value={resume ? historyCount : "—"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportData}
            className={cn(buttonVariants({ variant: "ghost", size: "md" }))}
          >
            <Download />
            Экспорт JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(buttonVariants({ variant: "ghost", size: "md" }))}
          >
            <Upload />
            Импорт
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
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

"use client";

import { useEffect, useState } from "react";

export default function ResetPage() {
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const lines: string[] = [];
    const push = (s: string) => {
      lines.push(s);
      setLog([...lines]);
    };

    (async () => {
      push("Старт сброса…");

      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          push(`SW найдено: ${regs.length}`);
          for (const r of regs) {
            await r.unregister();
            push(`SW unregister: ${r.scope}`);
          }
        }
      } catch (e) {
        push(`SW ошибка: ${String(e)}`);
      }

      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          push(`Caches: ${keys.length}`);
          for (const k of keys) {
            await caches.delete(k);
            push(`Удалён cache: ${k}`);
          }
        }
      } catch (e) {
        push(`Caches ошибка: ${String(e)}`);
      }

      try {
        localStorage.clear();
        push("localStorage очищен");
      } catch (e) {
        push(`localStorage ошибка: ${String(e)}`);
      }

      try {
        sessionStorage.clear();
        push("sessionStorage очищен");
      } catch (e) {
        push(`sessionStorage ошибка: ${String(e)}`);
      }

      try {
        if ("indexedDB" in window && indexedDB.databases) {
          const dbs = await indexedDB.databases();
          push(`IndexedDB: ${dbs.length}`);
          for (const d of dbs) {
            if (d.name) {
              indexedDB.deleteDatabase(d.name);
              push(`Удалена IDB: ${d.name}`);
            }
          }
        } else {
          indexedDB.deleteDatabase("kage-db-v1");
          push("Удалена IDB: kage-db-v1 (вручную)");
        }
      } catch (e) {
        push(`IndexedDB ошибка: ${String(e)}`);
      }

      push("Готово. Через 2 сек редирект на /");
      setDone(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 font-display text-3xl text-foreground">Сброс KAGE</h1>
      <p className="mb-6 text-sm text-text-dim">
        Удаляем сервис-воркер, кэши, localStorage, sessionStorage и IndexedDB.
      </p>
      <pre className="rounded-xl border border-border bg-surface p-4 text-xs text-foreground">
        {log.join("\n")}
      </pre>
      {done && (
        <div className="mt-4 rounded-lg border border-brand bg-brand/10 px-4 py-3 text-sm text-foreground">
          Сброс завершён. Если редирект не сработал —{" "}
          <a href="/" className="underline">
            нажми сюда
          </a>
          .
        </div>
      )}
    </div>
  );
}

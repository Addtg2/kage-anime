"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useLibraryStore } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";

export function RandomFromLibrary() {
  const router = useRouter();
  const hydrated = useHydrated();
  const entries = useLibraryStore((s) => s.entries);

  useEffect(() => {
    if (!hydrated) return;
    const planned = Object.values(entries).filter((e) => e.status === "planned");
    const pool = planned.length > 0 ? planned : Object.values(entries);
    if (pool.length === 0) {
      router.replace("/mylist");
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    router.replace(`/anime/${pick.anime.id}`);
  }, [hydrated, entries, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[600px] flex-col items-center justify-center px-[clamp(1rem,4vw,2.5rem)] text-center">
      <div className="size-12 animate-spin rounded-full border-2 border-border border-t-brand" />
      <p className="mt-4 text-sm text-text-dim">Выбираем случайное из вашей библиотеки…</p>
    </div>
  );
}

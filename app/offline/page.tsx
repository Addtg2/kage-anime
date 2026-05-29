import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Офлайн — KAGE",
  description: "Нет подключения к интернету",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[640px] flex-col items-center justify-center px-[clamp(1rem,3vw,2.5rem)] py-12 text-center">
      <div className="mb-6 text-[clamp(3rem,8vw,5rem)] leading-none">
        <span className="font-display italic text-brand">offline</span>
      </div>
      <h1 className="mb-3 font-display text-[clamp(1.5rem,3vw,2rem)] font-bold italic">
        Нет подключения
      </h1>
      <p className="mb-8 text-text-dim">
        Похоже, ты офлайн. Проверь интернет и попробуй ещё раз — мы тут будем.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          На главную
        </Link>
        <Link
          href="/mylist"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/5"
        >
          Моя библиотека
        </Link>
      </div>
    </div>
  );
}

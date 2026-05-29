"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="relative min-h-screen bg-background"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,46,99,0.10) 0%, transparent 70%), var(--background)",
      }}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand">500 · Ошибка</p>
        <h1 className="font-display mb-3 text-3xl sm:text-4xl">Что-то сломалось</h1>
        <p className="mb-8 max-w-md text-sm text-text-dim">
          {error.message ||
            "Не удалось загрузить страницу. Возможно, временный сбой — попробуйте ещё раз."}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            Попробовать снова
          </button>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
            На главную
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 font-mono text-[10px] text-text-mute">digest: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

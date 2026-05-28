"use client";

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
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand">
        Ошибка
      </p>
      <h1 className="font-display mb-3 text-3xl sm:text-4xl">
        Что-то сломалось
      </h1>
      <p className="mb-7 max-w-md text-sm text-text-dim">
        {error.message ||
          "Не удалось загрузить раздел. Возможно, временный сбой Shikimori — попробуйте ещё раз."}
      </p>
      <button
        type="button"
        onClick={reset}
        className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
      >
        Попробовать снова
      </button>
    </div>
  );
}

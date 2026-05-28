import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="font-jp mb-2 text-sm tracking-[0.3em] text-brand-2">404 · 影</p>
      <h1 className="font-display mb-3 text-4xl sm:text-5xl">Тайтл не найден</h1>
      <p className="mb-7 max-w-sm text-sm text-text-dim">
        Возможно, страница перенесена или такого тайтла нет в базе Shikimori.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
      >
        На главную
      </Link>
    </div>
  );
}

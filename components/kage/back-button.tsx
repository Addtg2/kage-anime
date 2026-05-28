"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Назад"
      className={
        "flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-xl transition-colors hover:bg-black/70 sm:size-11 " +
        (className ?? "")
      }
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

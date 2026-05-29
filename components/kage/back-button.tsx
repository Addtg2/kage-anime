"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const baseClass =
  "flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-xl transition-colors hover:bg-black/70 sm:size-11 ";

export function BackButton({
  className,
  href,
}: {
  className?: string;
  /** Если задан — переход всегда на этот адрес, минуя историю браузера. */
  href?: string;
}) {
  const router = useRouter();
  if (href) {
    return (
      <Link
        href={href}
        aria-label="Назад"
        className={baseClass + (className ?? "")}
      >
        <ChevronLeft className="size-5" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Назад"
      className={baseClass + (className ?? "")}
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

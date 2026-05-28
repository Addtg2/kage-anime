"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { KageLogo } from "./logo";
import { SearchBox } from "./search-box";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?order=aired_on", label: "Новинки" },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname.startsWith(base);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-[clamp(1rem,3vw,2.5rem)] sm:gap-6 lg:gap-8">
        <Link href="/" aria-label="KAGE — на главную" className="shrink-0">
          <KageLogo size={18} />
        </Link>

        {/* Десктоп-навигация; на мобиле живёт в BottomTabs */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[13px] transition-colors",
                  active
                    ? "font-semibold text-foreground"
                    : "font-medium text-text-dim hover:text-foreground",
                )}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-3.5 -bottom-1 h-0.5 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
          <SearchBox />

          <button
            type="button"
            aria-label="Уведомления"
            className="hidden text-text-dim transition-colors hover:text-foreground sm:inline-flex"
          >
            <Bell className="size-5" />
          </button>

          <button
            type="button"
            aria-label="Профиль"
            className="hidden size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white sm:flex"
            style={{
              background:
                "linear-gradient(135deg, var(--brand), var(--brand-2))",
            }}
          >
            А
          </button>
        </div>
      </div>
    </header>
  );
}

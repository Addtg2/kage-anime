"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CalendarDays, Home, Search, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

// Структура, унаследованная от прототипа KageBottomTabs.
// «Профиль» пока заглушка — будет реальной при появлении авторизации.
const TABS: Tab[] = [
  {
    href: "/",
    label: "Главная",
    icon: Home,
    match: (p) => p === "/",
  },
  {
    href: "/catalog",
    label: "Каталог",
    icon: Search,
    match: (p) => p.startsWith("/catalog") || p.startsWith("/anime"),
  },
  {
    href: "/schedule",
    label: "Эфир",
    icon: CalendarDays,
    match: (p) => p.startsWith("/schedule"),
  },
  {
    href: "/mylist",
    label: "Моё",
    icon: Bookmark,
    match: (p) => p.startsWith("/mylist"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomTabs() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const entries = useLibraryStore((s) => s.entries);
  const libraryCount = hydrated ? Object.keys(entries).length : 0;

  return (
    <nav
      aria-label="Нижняя навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elev/95 backdrop-blur-xl md:hidden"
    >
      <ul
        className="mx-auto flex max-w-md items-stretch justify-around gap-1 px-2 pt-2"
        style={{
          // safe-area для iOS «home indicator»; минимум 10px на других устройствах
          paddingBottom: "max(env(safe-area-inset-bottom), 10px)",
        }}
      >
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.label} className="flex flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors",
                  active
                    ? "text-brand"
                    : "text-text-dim active:bg-surface-2 active:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon
                    className="size-[22px]"
                    strokeWidth={active ? 2 : 1.6}
                  />
                  {t.href === "/mylist" && hydrated && libraryCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {libraryCount > 99 ? "99" : libraryCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "mx-auto h-1 w-1 rounded-full transition-colors",
                    active ? "bg-brand" : "bg-transparent",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] tracking-wide",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/store/settings";
import { useHydrated } from "@/lib/store/use-hydrated";

export function ThemeProvider() {
  const hydrated = useHydrated();
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    if (!hydrated) return;
    const html = document.documentElement;
    if (theme === "light") {
      html.dataset.theme = "light";
      html.classList.remove("dark");
    } else if (theme === "oled") {
      html.dataset.theme = "oled";
      html.classList.add("dark");
    } else {
      delete html.dataset.theme;
      html.classList.add("dark");
    }
  }, [hydrated, theme]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // В dev unregister выполняется в <head> beforeInteractive — здесь только prod-регистрация.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}

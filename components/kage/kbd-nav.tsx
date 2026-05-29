"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function KbdNav() {
  const router = useRouter();
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pending.current === "g") {
        if (timer.current) clearTimeout(timer.current);
        pending.current = null;
        if (key === "c") { e.preventDefault(); router.push("/catalog"); }
        if (key === "m") { e.preventDefault(); router.push("/mylist"); }
        if (key === "h") { e.preventDefault(); router.push("/"); }
        return;
      }

      if (key === "r") { e.preventDefault(); router.push("/random"); return; }

      if (key === "g") {
        pending.current = "g";
        timer.current = setTimeout(() => { pending.current = null; }, 1000);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}

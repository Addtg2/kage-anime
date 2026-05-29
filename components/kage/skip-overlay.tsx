"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface Props {
  /** Duration of the episode in minutes (from Shikimori). Null if unknown. */
  episodeDuration: number | null;
  /** Full href for the next episode, e.g. /anime/123/watch?ep=2 */
  nextEpHref: string | null;
  skipOpening: boolean;
  autoNext: boolean;
}

export function SkipOverlay({ episodeDuration, nextEpHref, skipOpening, autoNext }: Props) {
  const router = useRouter();

  // --- Skip OP ---
  const [showSkip, setShowSkip] = useState(false);
  // --- Auto-next countdown ---
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (skipOpening) {
      // Show after 30s, hide after 90s more
      timers.push(setTimeout(() => setShowSkip(true), 30_000));
      timers.push(setTimeout(() => setShowSkip(false), 120_000));
    }

    if (autoNext && nextEpHref && episodeDuration) {
      // episodeDuration is in minutes; show countdown 30s before end
      const triggerMs = Math.max((episodeDuration * 60 - 30) * 1000, 5_000);
      timers.push(
        setTimeout(() => {
          setCountdown(10);
          countdownRef.current = setInterval(() => {
            setCountdown((c) => {
              if (c === null) return null;
              if (c <= 1) return 0;
              return c - 1;
            });
          }, 1_000);
        }, triggerMs),
      );
    }

    return () => {
      timers.forEach(clearTimeout);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // Run only on mount (key changes when episode changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate when countdown hits 0
  useEffect(() => {
    if (countdown === 0 && nextEpHref) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      router.push(nextEpHref);
    }
  }, [countdown, nextEpHref, router]);

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  return (
    <>
      {/* Skip opening button */}
      {showSkip && (
        <button
          type="button"
          onClick={() => setShowSkip(false)}
          className={cn(
            "absolute bottom-14 right-4 z-10 flex items-center gap-2 rounded-lg",
            "border border-white/20 bg-black/70 px-4 py-2 text-sm font-medium text-white",
            "backdrop-blur-sm transition-all hover:bg-black/90 active:scale-95",
          )}
        >
          Пропустить опенинг ⏭
        </button>
      )}

      {/* Auto-next countdown overlay */}
      {countdown !== null && nextEpHref && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-black/80 px-8 py-6 text-center">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              Следующая серия
            </div>
            <div
              className="font-display text-7xl font-bold leading-none text-white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {countdown}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { if (nextEpHref) router.push(nextEpHref); }}
                className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Перейти
              </button>
              <button
                type="button"
                onClick={cancelCountdown}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

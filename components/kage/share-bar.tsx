"use client";

import { useState } from "react";
import { Share2, Send, ExternalLink } from "lucide-react";
import type { Anime } from "@/lib/anime/types";

interface ShareBarProps {
  anime: Anime;
  malId: string | null;
}

export function ShareBar({ anime, malId }: ShareBarProps) {
  const [toast, setToast] = useState(false);

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://kage.vercel.app/anime/${anime.id}`;

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 1500);
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: anime.titleRu, url: pageUrl });
        return;
      } catch {
        // cancelled or not supported — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(pageUrl);
    showToast();
  }

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(anime.titleRu)}`;
  const shikiUrl = `https://shikimori.one/animes/${anime.id}`;
  const malUrl = malId ? `https://myanimelist.net/anime/${malId}` : null;

  return (
    <div className="relative flex items-center gap-2">
      <IconBtn onClick={handleShare} title="Поделиться">
        <Share2 size={15} />
      </IconBtn>

      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
        <IconBtn title="Telegram">
          <Send size={15} />
        </IconBtn>
      </a>

      <a href={shikiUrl} target="_blank" rel="noopener noreferrer">
        <IconBtn title="Shikimori">
          <ShikimoriIcon />
        </IconBtn>
      </a>

      {malUrl && (
        <a href={malUrl} target="_blank" rel="noopener noreferrer">
          <IconBtn title="MyAnimeList">
            <ExternalLink size={15} />
          </IconBtn>
        </a>
      )}

      {toast && (
        <span className="pointer-events-none absolute left-0 top-full mt-1.5 rounded bg-foreground px-2 py-1 text-xs text-background">
          Скопировано
        </span>
      )}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      className="flex size-8 items-center justify-center rounded border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
    >
      {children}
    </button>
  );
}

function ShikimoriIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  );
}

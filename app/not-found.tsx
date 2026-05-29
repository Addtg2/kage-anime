import Link from "next/link";
import Image from "next/image";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAnimes } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";

async function getTopAnime() {
  try {
    const list = await fetchAnimes({ order: "ranked", kind: "tv", limit: 5 }, 3600);
    return list.map(mapShikiToAnime);
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const top = await getTopAnime();

  return (
    <div
      className="relative min-h-screen bg-background"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,46,99,0.12) 0%, transparent 70%), var(--background)",
      }}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pb-16 pt-24 text-center sm:pt-32">
        <p className="font-jp mb-2 text-sm tracking-[0.3em] text-brand-2">404 · 影</p>
        <h1 className="font-display mb-3 text-4xl sm:text-5xl">Тайтл не найден</h1>
        <p className="mb-8 max-w-sm text-sm text-text-dim">
          Возможно, страница перенесена или такого тайтла нет в базе Shikimori.
        </p>

        <div className="mb-10 flex gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
            На главную
          </Link>
          <Link
            href="/random"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Случайное
          </Link>
        </div>

        {top.length > 0 && (
          <div className="w-full">
            <p className="mb-4 text-xs uppercase tracking-widest text-text-mute">
              Лучшее прямо сейчас
            </p>
            <div className="flex justify-center gap-3">
              {top.map((anime) => (
                <Link
                  key={anime.id}
                  href={`/anime/${anime.id}`}
                  className="group relative w-[calc(20%-0.6rem)] min-w-[72px] max-w-[120px] shrink-0 overflow-hidden rounded-lg"
                  title={anime.titleRu ?? anime.title ?? ""}
                >
                  <div className="aspect-[2/3] bg-surface">
                    {anime.posterUrl ? (
                      <Image
                        src={anime.posterUrl}
                        alt={anime.titleRu ?? ""}
                        fill
                        sizes="120px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full bg-surface-2" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="truncate text-[10px] text-white/90">
                      {anime.titleRu ?? anime.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

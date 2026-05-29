"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

const SHORTNAME = process.env.NEXT_PUBLIC_DISQUS_SHORTNAME ?? "";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    disqus_config?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DISQUS?: any;
  }
}

export function Comments({ animeId }: { animeId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!SHORTNAME || loaded.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loaded.current = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.disqus_config = function (this: any) {
          this.page.url = `${window.location.origin}/anime/${animeId}`;
          this.page.identifier = `anime-${animeId}`;
        };

        const script = document.createElement("script");
        script.src = `https://${SHORTNAME}.disqus.com/embed.js`;
        script.setAttribute("data-timestamp", String(+new Date()));
        script.async = true;
        document.head.appendChild(script);
      },
      { rootMargin: "200px" },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animeId]);

  if (!SHORTNAME) return null;

  return (
    <section className="border-t border-border px-[clamp(1rem,4vw,3.5rem)] py-[clamp(1.5rem,3vw,2.5rem)]">
      <h2 className="font-display mb-6 flex items-center gap-2 text-[clamp(1.1rem,2vw,1.4rem)]">
        <MessageCircle className="size-5 text-brand" aria-hidden />
        Комментарии
      </h2>
      <div ref={containerRef}>
        <div id="disqus_thread" />
        <noscript>
          Включите JavaScript для просмотра комментариев.
        </noscript>
      </div>
    </section>
  );
}

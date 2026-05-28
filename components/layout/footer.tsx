import { KageLogo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-bg-elev">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 py-10 px-[clamp(1rem,4vw,2.5rem)]">
        <KageLogo size={16} />
        <p className="max-w-2xl text-sm leading-relaxed text-text-dim">
          KAGE 影 — учебный кинематографичный онлайн-кинотеатр аниме. Данные
          предоставлены{" "}
          <a
            href="https://shikimori.one"
            className="text-brand-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Shikimori
          </a>
          , видео — Kodik и Alloha. Pet-проект, не для коммерческого
          использования.
        </p>
        <p className="text-xs text-text-mute">
          © {new Date().getFullYear()} KAGE. Все права на тайтлы принадлежат их
          владельцам.
        </p>
      </div>
    </footer>
  );
}

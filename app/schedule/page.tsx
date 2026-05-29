import type { Metadata } from "next";
import { fetchSchedule } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import {
  ScheduleWeek,
  type GroupedSchedule,
  type ScheduleCardData,
} from "@/components/kage/schedule-week";

// Динамика, не SSG — Shikimori-запрос на билде иногда падает по таймауту
// и валит весь build. На рантайме с ISR-обёрткой (revalidate=3600) это безопасно.
export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Расписание — KAGE",
  description: "Недельное расписание выхода серий аниме",
};

export default async function SchedulePage() {
  const raw = await fetchSchedule();

  const grouped: GroupedSchedule = {};
  for (const entry of raw) {
    const anime = mapShikiToAnime(entry.shiki);
    const day = entry.nextAt.getDay(); // 0=Sun … 6=Sat
    const card: ScheduleCardData = {
      id: anime.id,
      titleRu: anime.titleRu,
      posterUrl: anime.posterUrl,
      palette: anime.palette,
      nextAt: entry.nextAt.toISOString(),
      nextEpisode: entry.nextEpisode,
    };
    (grouped[day] ??= []).push(card);
  }

  const total = raw.length;

  return (
    <div className="mx-auto max-w-[1600px] px-[clamp(1rem,3vw,2.5rem)] py-8">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold italic">
          Расписание
        </h1>
        {total > 0 && (
          <span className="text-sm text-text-dim">
            {total} онгоинг{total === 1 ? "" : total < 5 ? "а" : "ов"} на неделе
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-text-dim">Нет данных о предстоящих сериях.</p>
      ) : (
        <ScheduleWeek schedule={grouped} />
      )}
    </div>
  );
}

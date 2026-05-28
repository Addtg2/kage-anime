import { HeroSkeleton, RailSkeleton } from "@/components/kage/skeletons";

export default function HomeLoading() {
  return (
    <div className="bg-background">
      <HeroSkeleton tall />
      <div className="flex flex-col gap-9 pb-4 pt-6 sm:gap-12 lg:gap-14">
        <RailSkeleton title="В тренде" />
        <RailSkeleton title="Новинки сезона" />
        <RailSkeleton title="Топ всех времён" />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { fetchRandomAnime } from "@/lib/shikimori/api";
import { RandomFromLibrary } from "./client";

export const dynamic = "force-dynamic";

export default async function RandomPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  // Библиотека живёт в localStorage — выбор и редирект делаются на клиенте.
  if (from === "library") {
    return <RandomFromLibrary />;
  }

  const id = await fetchRandomAnime();
  redirect(id ? `/anime/${id}` : "/catalog");
}

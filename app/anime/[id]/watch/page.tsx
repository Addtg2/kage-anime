import { redirect } from "next/navigation";

// Плеер встроен в страницу аниме (/anime/[id]). Этот роут оставлен ради
// обратной совместимости старых ссылок/закладок — редиректим на детальную.
export default async function WatchRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string; start?: string }>;
}) {
  const { id } = await params;
  const { ep, start } = await searchParams;
  const qs = new URLSearchParams();
  if (ep) qs.set("ep", ep);
  if (start) qs.set("start", start);
  const query = qs.toString();
  redirect(`/anime/${id}${query ? `?${query}` : ""}#player`);
}

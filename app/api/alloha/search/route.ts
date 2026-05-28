import { allohaSearch } from "@/lib/alloha/client";

// Прокси к Alloha: скрывает токен. GET /api/alloha/search?shikimori_id=123
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("shikimori_id");
  if (!id) {
    return Response.json({ available: false, error: "missing_id" }, { status: 400 });
  }
  const source = await allohaSearch(id);
  return Response.json(source);
}

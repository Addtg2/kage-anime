import { kodikSearch } from "@/lib/kodik/client";

// Прокси к Kodik: скрывает токен. GET /api/kodik/search?shikimori_id=123
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("shikimori_id");
  if (!id) {
    return Response.json({ available: false, error: "missing_id" }, { status: 400 });
  }
  const source = await kodikSearch(id);
  return Response.json(source);
}

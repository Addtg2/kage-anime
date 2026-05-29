import { ImageResponse } from "next/og";

import { fetchAnimeById } from "@/lib/shikimori/api";
import { mapShikiToAnime } from "@/lib/anime/map";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  let titleRu = "KAGE";
  let titleJp = "";
  let year = 0;
  let rating = 0;
  let posterUrl: string | undefined;

  try {
    const shiki = await fetchAnimeById(id, 3600);
    if (shiki) {
      const a = mapShikiToAnime(shiki);
      titleRu = a.titleRu;
      titleJp = a.titleJp;
      year = a.year;
      rating = a.rating;
      posterUrl = a.posterUrl;
    }
  } catch {
    // fall through to fallback render
  }

  const bg = "#0a0a0f";
  const brand = "#e8294f";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: bg,
          color: "white",
          fontFamily: "sans-serif",
          padding: 60,
          position: "relative",
        }}
      >
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            width={340}
            height={510}
            style={{ borderRadius: 16, objectFit: "cover", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            marginLeft: posterUrl ? 60 : 0,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: brand,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 20,
              display: "flex",
            }}
          >
            {titleRu.length > 60 ? `${titleRu.slice(0, 58)}…` : titleRu}
          </div>
          {titleJp && (
            <div style={{ fontSize: 28, color: "#8a8a96", marginBottom: 28, display: "flex" }}>
              {titleJp}
            </div>
          )}
          <div style={{ display: "flex", gap: 18, fontSize: 26, color: "#bdbdc7", alignItems: "center" }}>
            {rating > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  background: brand,
                  color: "white",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                ★ {rating.toFixed(1)}
              </div>
            )}
            {year > 0 && <div style={{ display: "flex" }}>{year}</div>}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

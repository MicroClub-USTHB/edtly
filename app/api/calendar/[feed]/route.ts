import { createHash } from "node:crypto";
import { feedCalendar } from "@/lib/calendar/feed";
import { decodeFeed } from "@/lib/calendar/token";
import { getSection } from "@/lib/timetable/data";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/calendar/[feed]">,
) {
  const { feed } = await params;
  const token = feed.replace(/\.ics$/, "");
  const spec = decodeFeed(token);
  if (!spec) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { body, filename, updatedAt } = await feedCalendar(spec, token, (ref) =>
    getSection(ref.system, ref.level, ref.speciality, ref.section),
  );
  const etag = `"${createHash("sha1").update(body).digest("base64url")}"`;
  const headers = new Headers({
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control":
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    ETag: etag,
    "X-Robots-Tag": "noindex",
  });
  if (updatedAt) {
    headers.set(
      "Last-Modified",
      new Date(`${updatedAt}T00:00:00Z`).toUTCString(),
    );
  }

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { headers });
}

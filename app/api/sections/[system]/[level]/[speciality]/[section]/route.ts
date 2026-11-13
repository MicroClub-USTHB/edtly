import { getSection, getSectionParams } from "@/lib/timetable/data";

export async function generateStaticParams() {
  return (await getSectionParams()).filter(
    (params) => params.section !== "unique",
  );
}

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/sections/[system]/[level]/[speciality]/[section]">,
) {
  const { system, level, speciality, section } = await params;
  const lookup = await getSection(system, level, speciality, section);
  if (!lookup?.section) {
    return Response.json({ error: "not-found" }, { status: 404 });
  }

  const { programme } = lookup;
  return Response.json({
    programme: {
      level: programme.level,
      speciality: programme.speciality,
      sectionCount: programme.sectionCount,
      sourceUrl: programme.source.url,
    },
    section: lookup.section,
  });
}

import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";
import { getProgrammes } from "@/lib/timetable/data";
import { localized, sectionPath } from "@/lib/timetable/paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programmes = await getProgrammes();
  const pages = [
    { path: "/", lastModified: undefined as string | undefined },
    ...programmes.flatMap(({ system, level, speciality, source, sections }) =>
      sections
        .filter((section) => section.sessions.length > 0)
        .map((section) => ({
          path: sectionPath({
            system,
            level,
            speciality: speciality.id,
            section: section.id,
          }),
          lastModified: source.updatedAt,
        })),
    ),
  ];

  return pages.flatMap(({ path, lastModified }) =>
    routing.locales.map((locale) => ({
      url: site.url + localized(locale, path),
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, site.url + localized(l, path)]),
        ),
      },
    })),
  );
}

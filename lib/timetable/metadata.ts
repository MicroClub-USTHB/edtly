import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";
import { getSection, type TimetableParams } from "./data";
import { levelLabel, localized, sectionPath } from "./paths";

export async function timetableMetadata(
  locale: string,
  { group, ...params }: TimetableParams & { group?: string },
): Promise<Metadata> {
  const lookup = await getSection(
    params.system,
    params.level,
    params.speciality,
    params.section,
  );
  if (!lookup) return { robots: { index: false } };

  const t = await getTranslations("Metadata");
  const { programme, section } = lookup;
  const label = `${levelLabel(programme.level)} ${programme.speciality.name}`;
  const named = section && programme.sectionCount > 1 && section.name;
  const title = named
    ? t("timetableSectionTitle", { programme: label, section: section.name })
    : t("timetableTitle", { programme: label });
  const description = t("timetableDescription", {
    programme: named ? `${label}, section ${section.name}` : label,
    semester: programme.semester,
    year: programme.academicYear,
  });

  return {
    title,
    description,
    alternates: group
      ? { canonical: localized(locale, sectionPath(params)) }
      : alternatesFor(locale, sectionPath(params)),
    robots: { index: Boolean(section?.sessions.length) },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

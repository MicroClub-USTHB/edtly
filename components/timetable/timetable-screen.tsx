import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/json-ld";
import { formatShortDate, parseIsoDate } from "@/lib/format";
import { site } from "@/lib/site";
import {
  getCatalogue,
  getSection,
  type TimetableParams,
} from "@/lib/timetable/data";
import {
  groupSlug,
  levelLabel,
  localized,
  sectionPath,
} from "@/lib/timetable/paths";
import { TimetableUnreadable } from "./timetable-unreadable";
import { TimetableView } from "./timetable-view";

type TimetableScreenProps = TimetableParams & { group?: string };

export async function TimetableScreen({
  group: groupParam,
  ...params
}: TimetableScreenProps) {
  const [lookup, catalogue, locale, t] = await Promise.all([
    getSection(params.system, params.level, params.speciality, params.section),
    getCatalogue(),
    rootLocale(),
    getTranslations("Metadata"),
  ]);
  if (!lookup) notFound();

  const { programme, section } = lookup;
  const programmeLabel = `${levelLabel(programme.level)} ${programme.speciality.name}`;

  if (!section) {
    return (
      <TimetableUnreadable
        programmeLabel={programmeLabel}
        pdfUrl={programme.source.url}
        catalogue={catalogue}
      />
    );
  }

  const urlGroup = groupParam
    ? section.groups.find((group) => groupSlug(group) === groupParam)
    : null;
  if (urlGroup === undefined) notFound();

  const named = programme.sectionCount > 1 && section.name;
  const title = named
    ? t("timetableSectionTitle", {
        programme: programmeLabel,
        section: section.name,
      })
    : t("timetableTitle", { programme: programmeLabel });
  const updated = programme.source.updatedAt
    ? parseIsoDate(programme.source.updatedAt)
    : null;

  return (
    <main>
      <h1 className="sr-only">{`${title} · ${t("faculty")}`}</h1>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          url: site.url + localized(locale, sectionPath(params)),
          inLanguage: locale,
          dateModified: programme.source.updatedAt,
          isBasedOn: programme.source.url,
          isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
          about: {
            "@type": "CollegeOrUniversity",
            name: "Faculté d'Informatique, USTHB",
            url: "https://finfo.usthb.dz",
          },
        }}
      />

      <TimetableView
        key={sectionPath(params)}
        programme={programme}
        section={section}
        urlGroup={urlGroup}
        catalogue={catalogue}
        programmeLabel={programmeLabel}
        updatedShort={updated ? formatShortDate(updated, locale) : ""}
        version={process.env.APP_RELEASE ?? ""}
      />
    </main>
  );
}

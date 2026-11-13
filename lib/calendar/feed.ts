import { createHash } from "node:crypto";
import { createTranslator } from "next-intl";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { site } from "@/lib/site";
import type { SectionLookup } from "@/lib/timetable/data";
import {
  groupSlug,
  levelLabel,
  localized,
  parcoursPath,
  sectionPath,
  type SectionRef,
} from "@/lib/timetable/paths";
import { personalSessions, type RemoteSection } from "@/lib/timetable/personal";
import { sessionKey } from "@/lib/timetable/schedule";
import { eventText, type EventTranslate } from "./event";
import { buildCalendar } from "./ics";
import { termEnd } from "./term";
import type { FeedSpec } from "./token";

type Resolve = (ref: SectionRef) => Promise<SectionLookup | null>;

export type Feed = {
  body: string;
  filename: string;
  updatedAt: string | null;
};

const MESSAGES = { fr, en };
const EPOCH = "1970-01-01";

const hash = (text: string) =>
  createHash("sha1").update(text).digest("hex").slice(0, 24);

export async function feedCalendar(
  spec: FeedSpec,
  token: string,
  resolve: Resolve,
): Promise<Feed> {
  const t = createTranslator({
    locale: spec.locale,
    messages: MESSAGES[spec.locale] as typeof fr,
  });
  const translate: EventTranslate = (key, values) => t(key, values);
  const lookup = await resolve(spec.section);
  const section = lookup?.section;

  if (!lookup || !section) {
    return {
      body: buildCalendar(
        {
          name: "Edtly",
          description: t("Calendar.feed.missing"),
          locale: spec.locale,
          anchor: EPOCH,
          updatedAt: EPOCH,
          until: null,
        },
        [],
      ),
      filename: "edtly.ics",
      updatedAt: null,
    };
  }

  const { programme } = lookup;
  const group =
    spec.group && section.groups.includes(spec.group) ? spec.group : null;
  const programmeLabel = `${levelLabel(programme.level)} ${programme.speciality.name}`;
  const sectionName = programme.sectionCount > 1 ? section.name : "";

  const refs = new Map(
    spec.personal.extras.map((extra) => [sectionPath(extra), extra] as const),
  );
  const found = await Promise.all(
    [...refs].map(async ([path, ref]) => [path, await resolve(ref)] as const),
  );
  const remote = new Map<string, RemoteSection>();
  const dates = [programme.source.updatedAt];
  for (const [path, extra] of found) {
    if (!extra?.section) continue;
    remote.set(path, {
      label: [
        `${levelLabel(extra.programme.level)} ${extra.programme.speciality.name}`,
        extra.programme.sectionCount > 1 &&
          t("Timetable.sectionLabel", { name: extra.section.name }),
      ]
        .filter(Boolean)
        .join(" · "),
      url: extra.programme.source.url,
      sessions: extra.section.sessions,
    });
    dates.push(extra.programme.source.updatedAt);
  }

  const pageUrl =
    site.url +
    localized(
      spec.locale,
      parcoursPath({ ...spec.section, system: programme.system, group }),
    );
  const context = { sectionName, pageUrl, pdfUrl: programme.source.url };
  const events = personalSessions(
    section.sessions,
    spec.personal,
    group,
    remote,
  ).map((session) => ({
    uid: `${hash(`${token}|${sessionKey(session)}`)}@edtly`,
    day: session.day,
    start: session.start,
    end: session.end,
    url: pageUrl,
    ...eventText(session, translate, context),
  }));

  const label = [
    programmeLabel,
    sectionName && t("Timetable.sectionLabel", { name: sectionName }),
  ]
    .filter(Boolean)
    .join(" · ");
  const updatedAt = dates.filter(Boolean).sort().at(-1) ?? EPOCH;

  return {
    body: buildCalendar(
      {
        name: ["Edtly", programmeLabel, sectionName, group]
          .filter(Boolean)
          .join(" · "),
        description: t("Calendar.feed.description", {
          programme: label,
          semester: String(programme.semester),
          year: programme.academicYear,
        }),
        locale: spec.locale,
        anchor: programme.source.updatedAt || EPOCH,
        updatedAt,
        until: termEnd(programme.academicYear, programme.semester),
      },
      events,
    ),
    filename: `${[
      "edtly",
      programme.level,
      programme.speciality.id,
      section.id,
      group && groupSlug(group),
    ]
      .filter(Boolean)
      .join("-")}.ics`,
    updatedAt,
  };
}

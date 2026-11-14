import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createTranslator } from "next-intl";
import fr from "@/messages/fr.json";
import { eventText, type EventTranslate } from "@/lib/calendar/event";
import { feedCalendar } from "@/lib/calendar/feed";
import {
  buildCalendar,
  firstOccurrence,
  untilUtc,
  type CalendarEvent,
} from "@/lib/calendar/ics";
import {
  feedUrl,
  googleEventUrl,
  googleSubscribeUrl,
  webcalUrl,
} from "@/lib/calendar/links";
import { termEnd } from "@/lib/calendar/term";
import {
  decodeFeed,
  encodeFeed,
  feedOverrides,
  type FeedSpec,
} from "@/lib/calendar/token";
import type { SectionLookup } from "@/lib/timetable/data";
import type { SectionRef } from "@/lib/timetable/paths";
import { stateOf } from "@/lib/timetable/overrides";
import { EMPTY_PERSONAL } from "@/lib/timetable/personal";
import { programmeSchema } from "@/lib/timetable/schema";
import type { Session } from "@/lib/timetable/types";

const DATA_DIR = path.join(import.meta.dir, "..", "data");

async function resolve(ref: SectionRef): Promise<SectionLookup | null> {
  try {
    const raw = JSON.parse(
      readFileSync(
        path.join(DATA_DIR, ref.system, ref.level, `${ref.speciality}.json`),
        "utf8",
      ),
    );
    const { sections, ...info } = programmeSchema.parse(raw);
    const section = sections.find((candidate) => candidate.id === ref.section);
    return section
      ? { programme: { ...info, sectionCount: sections.length }, section }
      : null;
  } catch {
    return null;
  }
}

const isil: SectionRef = {
  system: "lmd",
  level: "l2",
  speciality: "isil",
  section: "a",
};

const spec = (patch: Partial<FeedSpec> = {}): FeedSpec => ({
  locale: "fr",
  section: isil,
  group: "G1",
  personal: EMPTY_PERSONAL,
  ...patch,
});

const t = createTranslator({ locale: "fr", messages: fr });
const translate: EventTranslate = (key, values) => t(key, values);

const unfold = (body: string) => body.replace(/\r\n /g, "");
const events = (body: string) => body.match(/BEGIN:VEVENT/g)?.length ?? 0;

async function feed(value: FeedSpec) {
  const token = encodeFeed(value);
  return feedCalendar(value, token, resolve);
}

describe("feed token", () => {
  test("round-trips a personalised timetable", () => {
    const value = spec({
      personal: {
        hidden: ["SEM300", "Histoire d'Algérie"],
        groups: { POO: "G2" },
        extras: [
          {
            system: "lmd",
            level: "l1",
            speciality: "informatique",
            section: "3",
            module: "ALGO",
            group: "G1",
          },
          {
            system: "lmd",
            level: "l1",
            speciality: "informatique",
            section: "1",
            module: "ANALY",
            group: null,
          },
        ],
      },
    });
    const decoded = decodeFeed(encodeFeed(value));
    expect(decoded).toEqual({
      ...value,
      personal: {
        ...value.personal,
        hidden: ["Histoire d'Algérie", "SEM300"],
      },
    });
  });

  test("is the same for the same choices in any order", () => {
    const a = spec({
      personal: {
        hidden: ["B", "A"],
        groups: { Y: "G2", X: "G1" },
        extras: [],
      },
    });
    const b = spec({
      personal: {
        hidden: ["A", "B"],
        groups: { X: "G1", Y: "G2" },
        extras: [],
      },
    });
    expect(encodeFeed(a)).toBe(encodeFeed(b));
  });

  test("keeps the default timetable short and URL safe", () => {
    const token = encodeFeed(spec());
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeLessThan(80);
    expect(decodeFeed(token)?.personal).toEqual(EMPTY_PERSONAL);
  });

  test("rejects anything that is not a valid token", () => {
    const encode = (value: unknown) =>
      btoa(JSON.stringify(value)).replace(/=+$/, "");
    const invalid = [
      "",
      "not a token!",
      "a".repeat(3000),
      btoa("not json"),
      encode({ l: "de", s: "lmd/l2/isil/a" }),
      encode({ l: "fr", s: "../../etc/passwd" }),
      encode({ l: "fr", s: "lmd/l2/isil" }),
      encode({ l: "fr", s: "lmd/l2/isil/a", h: "SEM300" }),
      btoa(String.fromCharCode(0xff, 0xfe)),
    ];
    for (const token of invalid) expect(decodeFeed(token)).toBeNull();
  });
});

describe("ics", () => {
  test("anchors weekly events on the publication week", () => {
    expect(firstOccurrence("2026-11-05", "sat")).toBe("20261031");
    expect(firstOccurrence("2026-11-05", "mon")).toBe("20261102");
    expect(firstOccurrence("2026-11-05", "thu")).toBe("20261105");
    expect(firstOccurrence("2026-11-06", "sat")).toBe("20261107");
  });

  test("ends recurring classes at the end of the semester", () => {
    expect(termEnd("2026/2027", 1)).toBe("2027-01-31");
    expect(termEnd("2026/2027", 2)).toBe("2027-06-30");
    expect(termEnd("", 1)).toBeNull();
    expect(untilUtc("2027-01-31")).toBe("20270131T225959Z");
  });

  test("escapes text and folds long lines at 75 octets", () => {
    const event: CalendarEvent = {
      uid: "1@edtly",
      day: "mon",
      start: "08:00",
      end: "09:30",
      summary: "Histoire d'Algérie · Cours, à distance; test",
      location: "",
      description: `Ligne 1\n${"é".repeat(80)}`,
      category: "Cours",
      url: "https://edtly.vercel.app/fr/lmd/l2/isil/a/g1",
    };
    const body = buildCalendar(
      {
        name: "Edtly · L2 ISIL",
        description: "Test",
        locale: "fr",
        anchor: "2026-11-05",
        updatedAt: "2026-11-05",
        until: "2027-01-31",
      },
      [event],
    );

    expect(body.endsWith("\r\n")).toBe(true);
    expect(body.replace(/\r\n/g, "")).not.toContain("\n");
    for (const line of body.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    const text = unfold(body);
    expect(text).toContain(
      "SUMMARY:Histoire d'Algérie · Cours\\, à distance\\; test",
    );
    expect(text).toContain(`DESCRIPTION:Ligne 1\\n${"é".repeat(80)}`);
    expect(text).toContain("DTSTART;TZID=Africa/Algiers:20261102T080000");
    expect(text).toContain("DTEND;TZID=Africa/Algiers:20261102T093000");
    expect(text).toContain("RRULE:FREQ=WEEKLY;UNTIL=20270131T225959Z");
    expect(text).toContain("BEGIN:VTIMEZONE");
    expect(text).not.toContain("LOCATION:");
  });

  test("leaves out classes that would start after the semester", () => {
    const body = buildCalendar(
      {
        name: "Edtly",
        description: "",
        locale: "fr",
        anchor: "2027-03-01",
        updatedAt: "2027-03-01",
        until: "2027-01-31",
      },
      [
        {
          uid: "1@edtly",
          day: "mon",
          start: "08:00",
          end: "09:30",
          summary: "A",
          location: "",
          description: "",
          category: "TD",
          url: "https://edtly.vercel.app",
        },
      ],
    );
    expect(events(body)).toBe(0);
  });
});

describe("calendar feed", () => {
  test("holds the group's classes once a week", async () => {
    const { body, filename, updatedAt } = await feed(spec());
    const text = unfold(body);

    expect(events(body)).toBe(14);
    expect(filename).toBe("edtly-l2-isil-a-g1.ics");
    expect(updatedAt).toBe("2026-11-05");
    expect(text).toContain("X-WR-CALNAME:Edtly · L2 ISIL · A · G1");
    expect(text).toContain("SUMMARY:SEM300 · TD");
    expect(text).toContain("SUMMARY:ALGO2 · Cours");
    expect(text).toContain("LOCATION:Salle 162\\, USTHB");
    expect(text).toContain("Enseignant : HEDJAZI-DELLAL");
    expect(text).toContain("URL:https://edtly.vercel.app/fr/lmd/l2/isil/a/g1");

    const uids = text.match(/^UID:.+$/gm) ?? [];
    expect(new Set(uids).size).toBe(uids.length);
  });

  test("is identical on every request so calendars can cache it", async () => {
    const first = await feed(spec());
    const second = await feed(spec());
    expect(second.body).toBe(first.body);
  });

  test("follows hidden modules and retakes", async () => {
    const { body } = await feed(
      spec({
        personal: {
          hidden: ["SEM300"],
          groups: {},
          extras: [
            {
              system: "lmd",
              level: "l1",
              speciality: "informatique",
              section: "1",
              module: "ALGO",
              group: "G1",
            },
          ],
        },
      }),
    );
    const text = unfold(body);

    expect(text).not.toContain("SUMMARY:SEM300");
    expect(text).toContain("SUMMARY:ALGO · Cours");
    expect(text).toContain("Module en dette · L1 Informatique · Section 1");
  });

  test("speaks the subscriber's language", async () => {
    const text = unfold((await feed(spec({ locale: "en" }))).body);
    expect(text).toContain("SUMMARY:ALGO2 · Lecture");
    expect(text).toContain("URL:https://edtly.vercel.app/en/lmd/l2/isil/a/g1");
  });

  test("empties the calendar when the section is gone", async () => {
    const { body, updatedAt } = await feed(
      spec({ section: { ...isil, section: "z" } }),
    );
    expect(events(body)).toBe(0);
    expect(updatedAt).toBeNull();
    expect(body).toContain("X-WR-CALNAME:Edtly");
  });
});

describe("calendar feed overrides", () => {
  const key = "mon|08:00|td|SEM300|162|G1";
  const moved = stateOf({ day: "tue", start: "13:00", end: "14:30", room: "210" });

  test("moves a class every week from a given week", async () => {
    const overrides = feedOverrides(
      [{ key, scope: "series", week: "2026-11-14", state: moved }],
      new Set([key]),
    );
    const body = unfold((await feed(spec({ overrides }))).body);
    const plain = unfold((await feed(spec())).body);
    expect(events(body)).toBe(events(plain) + 1);
    expect(body).toContain("DTSTART;TZID=Africa/Algiers:20261117T130000");
    expect(body).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261113T225959Z");
    expect(body).toContain("LOCATION:Salle 210\\, USTHB");
    expect(body).toContain("Modifié dans Edtly. Horaire officiel : Lundi 08:00 – 09:30");
  });

  test("cancels a single week with EXDATE", async () => {
    const overrides = feedOverrides(
      [
        {
          key,
          scope: "week",
          week: "2026-11-14",
          state: stateOf({ day: "mon", start: "08:00", end: "09:30", room: "162" }, true),
        },
      ],
      new Set([key]),
    );
    const body = unfold((await feed(spec({ overrides }))).body);
    expect(body).toContain("EXDATE;TZID=Africa/Algiers:20261116T080000");
    expect(events(body)).toBe(events(unfold((await feed(spec())).body)));
  });

  test("ignores overrides for classes outside the feed", async () => {
    const overrides = feedOverrides(
      [{ key: "mon|08:00|td|NOPE|1|G9", scope: "week", week: "2026-11-14", state: moved }],
      new Set(["mon|08:00|td|NOPE|1|G9"]),
    );
    const withoutUids = (body: string) => body.replace(/UID:[^\r]+/g, "UID");
    expect(withoutUids((await feed(spec({ overrides }))).body)).toBe(
      withoutUids((await feed(spec())).body),
    );
  });
});

describe("calendar links", () => {
  const session: Session = {
    day: "mon",
    start: "08:00",
    end: "09:30",
    type: "td",
    module: "SEM300",
    room: "162",
    teacher: "HEDJAZI-DELLAL",
    groups: ["G1"],
  };
  const context = {
    sectionName: "A",
    pageUrl: "https://edtly.vercel.app/fr/lmd/l2/isil/a/g1",
    pdfUrl: "https://finfo.usthb.dz/l2.pdf",
  };

  test("subscribes through webcal", () => {
    const url = feedUrl("abc");
    expect(url).toBe("https://edtly.vercel.app/api/calendar/abc.ics");
    expect(webcalUrl(url)).toBe(
      "webcal://edtly.vercel.app/api/calendar/abc.ics",
    );
    expect(googleSubscribeUrl(url)).toBe(
      "https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fedtly.vercel.app%2Fapi%2Fcalendar%2Fabc.ics",
    );
  });

  test("prefills one class in Google Calendar", () => {
    const url = new URL(
      googleEventUrl(eventText(session, translate, context), {
        date: new Date(2026, 10, 16),
        start: session.start,
        end: session.end,
        until: "2027-01-31",
      }),
    );
    const params = url.searchParams;

    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(params.get("action")).toBe("TEMPLATE");
    expect(params.get("text")).toBe("SEM300 · TD");
    expect(params.get("dates")).toBe("20261116T080000/20261116T093000");
    expect(params.get("ctz")).toBe("Africa/Algiers");
    expect(params.get("location")).toBe("Salle 162, USTHB");
    expect(params.get("recur")).toBe(
      "RRULE:FREQ=WEEKLY;UNTIL=20270131T225959Z",
    );
    expect(params.get("details")).toBe(
      [
        "TD · Groupe 1",
        "Enseignant : HEDJAZI-DELLAL",
        "",
        "Emploi du temps : https://edtly.vercel.app/fr/lmd/l2/isil/a/g1",
        "PDF officiel : https://finfo.usthb.dz/l2.pdf",
      ].join("\n"),
    );
  });

  test("does not repeat a class added after the semester", () => {
    const url = new URL(
      googleEventUrl(eventText(session, translate, context), {
        date: new Date(2027, 2, 1),
        start: session.start,
        end: session.end,
        until: "2027-01-31",
      }),
    );
    expect(url.searchParams.has("recur")).toBe(false);
  });

  test("describes remote and retake classes", () => {
    const text = eventText(
      {
        ...session,
        type: "cours",
        groups: [],
        room: "À distance",
        teacher: "",
        origin: "L1 Informatique · Section 3",
        originUrl: "https://finfo.usthb.dz/l1.pdf",
      },
      translate,
      context,
    );
    expect(text.location).toBe("À distance");
    expect(text.description).toBe(
      [
        "Cours · Toute la section",
        "Module en dette · L1 Informatique · Section 3",
        "",
        "Emploi du temps : https://edtly.vercel.app/fr/lmd/l2/isil/a/g1",
        "PDF officiel : https://finfo.usthb.dz/l1.pdf",
      ].join("\n"),
    );
  });
});

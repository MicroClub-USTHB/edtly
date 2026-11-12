import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { groupSlug } from "./paths";
import { programmeSchema } from "./schema";
import { sortSessions } from "./schedule";
import {
  LEVELS,
  SYSTEMS,
  type CatalogueProgramme,
  type Programme,
  type ProgrammeInfo,
  type Section,
  type SystemId,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const OFFICIAL_PAGE = "https://finfo.usthb.dz/etudes/emploi-du-temps";

function unsupported(
  system: SystemId,
  level: string,
  id: string,
  raw: unknown,
): Programme {
  const record = (raw ?? {}) as Partial<Programme>;
  const url = record.source?.url;
  return {
    system,
    level,
    speciality: { id, name: record.speciality?.name || id.toUpperCase() },
    academicYear: record.academicYear ?? "",
    semester: record.semester === 2 ? 2 : 1,
    status: "unsupported",
    source: {
      title: record.source?.title ?? "",
      url: typeof url === "string" && url.startsWith("https://") ? url : OFFICIAL_PAGE,
      updatedAt: record.source?.updatedAt ?? "",
    },
    sections: [],
  };
}

async function readProgramme(
  system: SystemId,
  level: string,
  file: string,
): Promise<Programme> {
  const id = file.replace(/\.json$/, "");
  let raw: unknown;
  try {
    raw = JSON.parse(
      await readFile(path.join(DATA_DIR, system, level, file), "utf8"),
    );
  } catch {
    return unsupported(system, level, id, null);
  }

  const result = programmeSchema.safeParse(raw);
  const consistent =
    result.success &&
    result.data.system === system &&
    result.data.level === level &&
    result.data.speciality.id === id;

  if (!consistent) {
    console.warn(
      `[edtly] data/${system}/${level}/${file} is invalid and was marked unsupported`,
      result.success ? "path does not match its content" : result.error.issues,
    );
    return unsupported(system, level, id, raw);
  }

  return {
    ...result.data,
    sections: result.data.sections.map((section) => ({
      ...section,
      sessions: sortSessions(section.sessions),
    })),
  };
}

export async function getProgrammes(): Promise<Programme[]> {
  "use cache";
  cacheLife("max");

  const programmes: Programme[] = [];
  for (const system of SYSTEMS) {
    for (const level of LEVELS[system]) {
      const files = await readdir(path.join(DATA_DIR, system, level)).catch(
        () => [] as string[],
      );
      const loaded = await Promise.all(
        files
          .filter((file) => file.endsWith(".json"))
          .sort()
          .map((file) => readProgramme(system, level, file)),
      );
      programmes.push(...loaded);
    }
  }
  return programmes;
}

export async function getCatalogue(): Promise<CatalogueProgramme[]> {
  const programmes = await getProgrammes();
  return programmes.map(({ system, level, speciality, status, sections }) => ({
    system,
    level,
    speciality,
    status,
    sections: sections.map(({ id, name, groups }) => ({ id, name, groups })),
  }));
}

export type SectionLookup = {
  programme: ProgrammeInfo;
  section: Section | null;
};

export async function getSection(
  system: string,
  level: string,
  speciality: string,
  sectionId: string,
): Promise<SectionLookup | null> {
  const programmes = await getProgrammes();
  const found = programmes.find(
    (programme) =>
      programme.system === system &&
      programme.level === level &&
      programme.speciality.id === speciality,
  );
  if (!found) return null;

  const { sections, ...info } = found;
  const programme = { ...info, sectionCount: sections.length };
  if (found.status === "unsupported") {
    return sectionId === "unique" ? { programme, section: null } : null;
  }

  const section = sections.find((candidate) => candidate.id === sectionId);
  return section ? { programme, section } : null;
}

export type TimetableParams = {
  system: string;
  level: string;
  speciality: string;
  section: string;
};

export async function getSectionParams(): Promise<TimetableParams[]> {
  const programmes = await getProgrammes();
  return programmes.flatMap(({ system, level, speciality, status, sections }) =>
    status === "unsupported"
      ? [{ system, level, speciality: speciality.id, section: "unique" }]
      : sections.map((section) => ({
          system,
          level,
          speciality: speciality.id,
          section: section.id,
        })),
  );
}

export async function getGroupParams(): Promise<
  (TimetableParams & { group: string })[]
> {
  const programmes = await getProgrammes();
  return programmes.flatMap(({ system, level, speciality, sections }) =>
    sections.flatMap((section) =>
      section.groups.map((group) => ({
        system,
        level,
        speciality: speciality.id,
        section: section.id,
        group: groupSlug(group),
      })),
    ),
  );
}

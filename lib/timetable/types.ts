export const DAYS = ["sat", "sun", "mon", "tue", "wed", "thu"] as const;
export const SESSION_TYPES = ["cours", "td", "tp"] as const;
export const SYSTEMS = ["lmd", "ing"] as const;
export const LEVELS = {
  lmd: ["l1", "l2", "l3", "m1", "m2"],
  ing: ["ing1", "ing2", "ing3", "ing4", "ing5"],
} as const;

export type Day = (typeof DAYS)[number];
export type SessionType = (typeof SESSION_TYPES)[number];
export type SystemId = (typeof SYSTEMS)[number];
export type ProgrammeStatus = "published" | "unsupported";

export type Session = {
  day: Day;
  start: string;
  end: string;
  type: SessionType;
  module: string;
  room: string;
  teacher: string;
  groups: string[];
  origin?: string;
  originUrl?: string;
};

export type Section = {
  id: string;
  name: string;
  groups: string[];
  sessions: Session[];
};

export type ProgrammeSource = {
  title: string;
  url: string;
  updatedAt: string;
};

export type Programme = {
  system: SystemId;
  level: string;
  speciality: { id: string; name: string };
  academicYear: string;
  semester: 1 | 2;
  status: ProgrammeStatus;
  source: ProgrammeSource;
  sections: Section[];
};

export type CatalogueSection = Pick<Section, "id" | "name" | "groups">;

export type CatalogueProgramme = Pick<
  Programme,
  "system" | "level" | "speciality" | "status"
> & { sections: CatalogueSection[] };

export type Parcours = {
  system: SystemId;
  level: string;
  speciality: string;
  section: string;
  group: string | null;
};

export type ProgrammeInfo = Omit<Programme, "sections"> & {
  sectionCount: number;
};

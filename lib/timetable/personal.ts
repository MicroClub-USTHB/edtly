import { sectionPath, type SectionRef } from "./paths";
import {
  groupOfType,
  sessionKey,
  sortSessions,
  type Matcher,
} from "./schedule";
import { SESSION_TYPES, type Session, type SessionType } from "./types";

export type Extra = SectionRef & { module: string; group: string | null };

export type Personal = {
  hidden: string[];
  groups: Record<string, string>;
  extras: Extra[];
};

export type ModuleInfo = {
  name: string;
  types: SessionType[];
  groups: string[];
};

export type RemoteSection = {
  label: string;
  url: string;
  sessions: Session[];
};

export const EMPTY_PERSONAL: Personal = { hidden: [], groups: {}, extras: [] };

const groupOrder = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

export function modulesOf(sessions: Session[]): ModuleInfo[] {
  const modules = new Map<string, { types: Set<SessionType>; groups: Set<string> }>();
  for (const session of sessions) {
    const entry = modules.get(session.module) ?? {
      types: new Set(),
      groups: new Set(),
    };
    entry.types.add(session.type);
    session.groups.forEach((group) => entry.groups.add(group));
    modules.set(session.module, entry);
  }
  return [...modules]
    .map(([name, { types, groups }]) => ({
      name,
      types: SESSION_TYPES.filter((type) => types.has(type)),
      groups: [...groups].sort(groupOrder),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const extraKey = (extra: Extra) =>
  `${sectionPath(extra)}|${extra.module}`;

export const isCustomized = (personal: Personal) =>
  personal.hidden.length > 0 ||
  Object.keys(personal.groups).length > 0 ||
  personal.extras.length > 0;

function moduleOverride(module: ModuleInfo, personal: Personal) {
  const override = personal.groups[module.name];
  return override && module.groups.includes(override) ? override : null;
}

export const defaultGroupFor = (
  module: ModuleInfo,
  mainGroup: string | null,
  tpGroup: string | null = mainGroup,
) => (module.types.every((type) => type === "tp") ? tpGroup : mainGroup);

export const groupFor = (
  module: ModuleInfo,
  personal: Personal,
  mainGroup: string | null,
  tpGroup: string | null = mainGroup,
) =>
  moduleOverride(module, personal) ??
  defaultGroupFor(module, mainGroup, tpGroup);

const attends = (session: Session, group: string | null) =>
  session.groups.length === 0 ||
  (group !== null && session.groups.includes(group));

export function personalSessions(
  base: Session[],
  personal: Personal,
  mainGroup: string | null,
  remote: ReadonlyMap<string, RemoteSection>,
  tpGroup: string | null = mainGroup,
): Session[] {
  const hidden = new Set(personal.hidden);
  const overrides = new Map(
    modulesOf(base).flatMap((module) => {
      const override = moduleOverride(module, personal);
      return override ? [[module.name, override] as const] : [];
    }),
  );

  const own = base.filter(
    (session) =>
      !hidden.has(session.module) &&
      attends(
        session,
        overrides.get(session.module) ??
          groupOfType(session, mainGroup, tpGroup),
      ),
  );

  const extras = personal.extras.flatMap((extra) => {
    const source = remote.get(sectionPath(extra));
    if (!source) return [];
    return source.sessions
      .filter(
        (session) =>
          session.module === extra.module && attends(session, extra.group),
      )
      .map((session) => ({
        ...session,
        origin: source.label,
        originUrl: source.url,
      }));
  });

  const seen = new Set<string>();
  return sortSessions(
    [...own, ...extras].filter((session) => {
      const key = sessionKey(session);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

export function matcherFor(sessions: Session[]): Matcher {
  const keys = new Set(sessions.map(sessionKey));
  return (session) => keys.has(sessionKey(session));
}

export function mergeSessions(primary: Session[], rest: Session[]) {
  const keys = new Set(primary.map(sessionKey));
  return sortSessions([
    ...primary,
    ...rest.filter((session) => !keys.has(sessionKey(session))),
  ]);
}

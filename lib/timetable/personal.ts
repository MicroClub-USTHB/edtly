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
  tpGroups: Record<string, string>;
  extras: Extra[];
};

export type GroupKind = "td" | "tp";

export type ModuleInfo = {
  name: string;
  types: SessionType[];
  groups: string[];
  tdGroups: string[];
  tpGroups: string[];
};

export type RemoteSection = {
  label: string;
  url: string;
  sessions: Session[];
};

export const EMPTY_PERSONAL: Personal = {
  hidden: [],
  groups: {},
  tpGroups: {},
  extras: [],
};

export const kindOf = (session: Session): GroupKind =>
  session.type === "tp" ? "tp" : "td";

const groupOrder = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

type ModuleEntry = {
  types: Set<SessionType>;
  groups: Record<GroupKind, Set<string>>;
};

const sorted = (groups: Iterable<string>) => [...groups].sort(groupOrder);

export function modulesOf(sessions: Session[]): ModuleInfo[] {
  const modules = new Map<string, ModuleEntry>();
  for (const session of sessions) {
    const entry = modules.get(session.module) ?? {
      types: new Set(),
      groups: { td: new Set(), tp: new Set() },
    };
    entry.types.add(session.type);
    session.groups.forEach((group) => entry.groups[kindOf(session)].add(group));
    modules.set(session.module, entry);
  }
  return [...modules]
    .map(([name, { types, groups }]) => ({
      name,
      types: SESSION_TYPES.filter((type) => types.has(type)),
      groups: sorted(new Set([...groups.td, ...groups.tp])),
      tdGroups: sorted(groups.td),
      tpGroups: sorted(groups.tp),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const extraKey = (extra: Extra) =>
  `${sectionPath(extra)}|${extra.module}`;

export const isCustomized = (personal: Personal) =>
  personal.hidden.length > 0 ||
  Object.keys(personal.groups).length > 0 ||
  Object.keys(personal.tpGroups).length > 0 ||
  personal.extras.length > 0;

export const groupsOfKind = (module: ModuleInfo, kind: GroupKind) =>
  kind === "tp" ? module.tpGroups : module.tdGroups;

const overridesOfKind = (personal: Personal, kind: GroupKind) =>
  kind === "tp" ? personal.tpGroups : personal.groups;

export function groupFor(
  module: ModuleInfo,
  personal: Personal,
  kind: GroupKind,
  fallback: string | null,
) {
  const override = overridesOfKind(personal, kind)[module.name];
  return override && groupsOfKind(module, kind).includes(override)
    ? override
    : fallback;
}

export function withModuleGroup(
  personal: Personal,
  module: string,
  kind: GroupKind,
  group: string | null,
): Personal {
  const rest = Object.entries(overridesOfKind(personal, kind)).filter(
    ([name]) => name !== module,
  );
  const next = Object.fromEntries(group ? [...rest, [module, group]] : rest);
  return kind === "tp"
    ? { ...personal, tpGroups: next }
    : { ...personal, groups: next };
}

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
  const modules = new Map(
    modulesOf(base).map((module) => [module.name, module] as const),
  );

  const own = base.filter((session) => {
    if (hidden.has(session.module)) return false;
    const fallback = groupOfType(session, mainGroup, tpGroup);
    const info = modules.get(session.module);
    return attends(
      session,
      info ? groupFor(info, personal, kindOf(session), fallback) : fallback,
    );
  });

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

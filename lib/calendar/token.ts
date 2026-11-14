import { z } from "zod";
import { routing } from "@/i18n/routing";
import {
  hashKey,
  type Override,
  type SessionState,
} from "@/lib/timetable/overrides";
import { sectionPath, type SectionRef } from "@/lib/timetable/paths";
import type { Personal } from "@/lib/timetable/personal";
import { DAYS, type OverrideScope } from "@/lib/timetable/types";

export type FeedLocale = (typeof routing.locales)[number];

export type FeedOverride = {
  ref: string;
  scope: OverrideScope;
  week: string;
  state: SessionState | null;
};

export type FeedSpec = {
  locale: FeedLocale;
  section: SectionRef;
  group: string | null;
  personal: Personal;
  overrides?: FeedOverride[];
};

const MAX_TOKEN_LENGTH = 4096;
export const MAX_FEED_OVERRIDES = 40;
const path = z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+){3}$/);
const name = z.string().min(1).max(120);
const ref = z.string().regex(/^[0-9a-z]{1,8}$/);
const scope = z.union([z.literal(0), z.literal(1)]);
const week = z.string().regex(/^\d{8}$/);
const clock = z.string().regex(/^([01]\d|2[0-3])[0-5]\d$/);
const overrideWire = z.union([
  z.tuple([ref, scope, week]),
  z.tuple([ref, scope, week, z.enum(DAYS), clock, clock, z.string().max(60)]),
]);

const wireSchema = z.object({
  l: z.enum(routing.locales),
  s: path,
  g: name.optional(),
  h: z.array(name).max(100).optional(),
  m: z.record(name, name).optional(),
  x: z
    .array(z.tuple([path, name, name.nullable()]))
    .max(30)
    .optional(),
  o: z.array(overrideWire).max(MAX_FEED_OVERRIDES).optional(),
});

type Wire = z.infer<typeof wireSchema>;
type OverrideWire = z.infer<typeof overrideWire>;

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const toPath = (ref: SectionRef) => sectionPath(ref).slice(1);

function toRef(value: string): SectionRef {
  const [system, level, speciality, section] = value.split("/");
  return { system, level, speciality, section };
}

function toBase64Url(text: string) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(token: string) {
  const binary = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

const toWireWeek = (iso: string) => iso.replace(/-/g, "");
const fromWireWeek = (value: string) =>
  `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
const toClock = (time: string) => time.replace(":", "");
const fromClock = (value: string) => `${value.slice(0, 2)}:${value.slice(2)}`;

export function feedOverrides(
  overrides: Override[],
  keys: ReadonlySet<string>,
): FeedOverride[] {
  return overrides
    .filter((override) => keys.has(override.key))
    .sort((a, b) => b.week.localeCompare(a.week))
    .slice(0, MAX_FEED_OVERRIDES)
    .map((override) => ({
      ref: hashKey(override.key),
      scope: override.scope,
      week: override.week,
      state: override.state.cancelled ? null : override.state,
    }));
}

function toOverrideWire({ ref, scope, week, state }: FeedOverride): OverrideWire {
  const wireScope = scope === "series" ? 1 : 0;
  const wireWeek = toWireWeek(week);
  return state
    ? [
        ref,
        wireScope,
        wireWeek,
        state.day,
        toClock(state.start),
        toClock(state.end),
        state.room.slice(0, 60),
      ]
    : [ref, wireScope, wireWeek];
}

const compareOverrides = (a: FeedOverride, b: FeedOverride) =>
  byCodePoint(a.ref, b.ref) ||
  byCodePoint(a.week, b.week) ||
  byCodePoint(a.scope, b.scope);

export const feedLocale = (locale: string): FeedLocale =>
  routing.locales.find((candidate) => candidate === locale) ??
  routing.defaultLocale;

export function encodeFeed({
  locale,
  section,
  group,
  personal,
  overrides = [],
}: FeedSpec) {
  const moduleGroups = Object.entries(personal.groups).sort(([a], [b]) =>
    byCodePoint(a, b),
  );
  const wire: Wire = {
    l: locale,
    s: toPath(section),
    ...(group ? { g: group } : {}),
    ...(personal.hidden.length > 0
      ? { h: [...new Set(personal.hidden)].sort(byCodePoint) }
      : {}),
    ...(moduleGroups.length > 0
      ? { m: Object.fromEntries(moduleGroups) }
      : {}),
    ...(personal.extras.length > 0
      ? {
          x: personal.extras.map(
            (extra) => [toPath(extra), extra.module, extra.group] as const,
          ),
        }
      : {}),
    ...(overrides.length > 0
      ? {
          o: [...overrides]
            .sort(compareOverrides)
            .slice(0, MAX_FEED_OVERRIDES)
            .map(toOverrideWire),
        }
      : {}),
  };
  return toBase64Url(JSON.stringify(wire));
}

export function decodeFeed(token: string): FeedSpec | null {
  if (
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(token)
  ) {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(token));
  } catch {
    return null;
  }

  const result = wireSchema.safeParse(raw);
  if (!result.success) return null;

  const { l, s, g, h, m, x, o } = result.data;
  return {
    locale: l,
    section: toRef(s),
    group: g ?? null,
    personal: {
      hidden: h ?? [],
      groups: m ?? {},
      extras: (x ?? []).map(([extraPath, module, group]) => ({
        ...toRef(extraPath),
        module,
        group,
      })),
    },
    ...(o ? { overrides: o.flatMap(decodeOverride) } : {}),
  };
}

function decodeOverride(wire: OverrideWire): FeedOverride[] {
  const [overrideRef, overrideScope, overrideWeek] = wire;
  const base = {
    ref: overrideRef,
    scope: overrideScope === 1 ? ("series" as const) : ("week" as const),
    week: fromWireWeek(overrideWeek),
  };
  if (wire.length === 3) return [{ ...base, state: null }];
  const [, , , day, start, end, room] = wire;
  const from = fromClock(start);
  const to = fromClock(end);
  return from < to
    ? [{ ...base, state: { day, start: from, end: to, room, cancelled: false } }]
    : [];
}

import { z } from "zod";
import { routing } from "@/i18n/routing";
import { sectionPath, type SectionRef } from "@/lib/timetable/paths";
import type { Personal } from "@/lib/timetable/personal";

export type FeedLocale = (typeof routing.locales)[number];

export type FeedSpec = {
  locale: FeedLocale;
  section: SectionRef;
  group: string | null;
  personal: Personal;
};

const MAX_TOKEN_LENGTH = 2048;
const path = z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+){3}$/);
const name = z.string().min(1).max(120);

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
});

type Wire = z.infer<typeof wireSchema>;

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

export const feedLocale = (locale: string): FeedLocale =>
  routing.locales.find((candidate) => candidate === locale) ??
  routing.defaultLocale;

export function encodeFeed({ locale, section, group, personal }: FeedSpec) {
  const overrides = Object.entries(personal.groups).sort(([a], [b]) =>
    byCodePoint(a, b),
  );
  const wire: Wire = {
    l: locale,
    s: toPath(section),
    ...(group ? { g: group } : {}),
    ...(personal.hidden.length > 0
      ? { h: [...new Set(personal.hidden)].sort(byCodePoint) }
      : {}),
    ...(overrides.length > 0 ? { m: Object.fromEntries(overrides) } : {}),
    ...(personal.extras.length > 0
      ? {
          x: personal.extras.map(
            (extra) => [toPath(extra), extra.module, extra.group] as const,
          ),
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

  const { l, s, g, h, m, x } = result.data;
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
  };
}

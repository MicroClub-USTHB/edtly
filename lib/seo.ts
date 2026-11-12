import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export function alternatesFor(
  locale: string,
  path: string,
): NonNullable<Metadata["alternates"]> {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `/${locale}${suffix}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${suffix}`])),
      "x-default": path,
    },
  };
}

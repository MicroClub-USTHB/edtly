import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

const paths = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string, path: string) =>
    `${site.url}/${locale}${path === "/" ? "" : path}`;

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, url(l, path)]),
        ),
      },
    })),
  );
}

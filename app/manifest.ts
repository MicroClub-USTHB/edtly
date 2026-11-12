import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: site.name,
    description:
      "The timetable for USTHB Informatique students. Select your group, see your classes, go.",
    lang: routing.defaultLocale,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: site.colors.primary,
    theme_color: site.colors.background.light,
    categories: ["education", "productivity"],
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

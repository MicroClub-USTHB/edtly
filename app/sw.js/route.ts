import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { routing } from "@/i18n/routing";

async function serviceWorkerSource() {
  "use cache";
  cacheLife("max");
  const source = await readFile(
    path.join(process.cwd(), "lib/pwa/sw.js"),
    "utf8",
  );
  const config = JSON.stringify({
    version: process.env.APP_VERSION,
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
  });
  return source.replace("self.__SW_CONFIG__", config);
}

export async function GET() {
  return new Response(await serviceWorkerSource(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'",
    },
  });
}

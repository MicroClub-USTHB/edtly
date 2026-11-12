const { version, locales, defaultLocale } = self.__SW_CONFIG__;

const CACHE_PREFIX = "edtly-";
const CACHE = `${CACHE_PREFIX}${version}`;
const PAGES = locales.map((locale) => `/${locale}`);
const STATIC_FILES = [
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];
const STATIC_PREFIXES = ["/_next/static/", "/brand/", "/icons/", "/splash/"];
const ASSET_IN_HTML = /\/_next\/static\/[^"'\s\\)]+/g;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set(STATIC_FILES);

      for (const page of PAGES) {
        const response = await fetch(page, { cache: "reload" });
        if (!response.ok) throw new Error(`Precache failed: ${page}`);
        const html = await response.clone().text();
        for (const [asset] of html.matchAll(ASSET_IN_HTML)) assets.add(asset);
        await cache.put(page, response);
      }

      await Promise.allSettled(
        [...assets].map((asset) =>
          cache.add(new Request(asset, { cache: "reload" })),
        ),
      );

      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request, url));
    return;
  }

  if (
    STATIC_FILES.includes(url.pathname) ||
    STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    event.respondWith(cacheFirst(request));
  }
});

async function navigate(request, url) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(url.pathname, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(url.pathname, response.clone());
    }
    return response;
  } catch (error) {
    const home = `/${await preferredLocale()}`;
    if (url.pathname !== home && (await cache.match(home))) {
      return Response.redirect(home, 302);
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
  }
  return response;
}

async function preferredLocale() {
  try {
    const cookie = await self.cookieStore?.get("NEXT_LOCALE");
    if (cookie && locales.includes(cookie.value)) return cookie.value;
  } catch {}
  return defaultLocale;
}

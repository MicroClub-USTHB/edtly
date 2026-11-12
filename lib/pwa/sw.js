const { version, locales, defaultLocale } = self.__SW_CONFIG__;

const CACHE_PREFIX = "edtly-";
const CACHE = `${CACHE_PREFIX}${version}`;
const HOME_PAGES = locales.map((locale) => `/${locale}`);
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
const PAGE_PATH = new RegExp(`^/(${locales.join("|")})(/[a-z0-9-]+)*$`);
const MAX_CARRIED_PAGES = 30;

async function cachePage(cache, path) {
  const response = await fetch(path, { cache: "reload" });
  if (!response.ok || response.redirected) {
    throw new Error(`Cannot cache ${path}`);
  }
  const html = await response.clone().text();
  await cache.put(path, response);
  const assets = [...new Set(html.match(ASSET_IN_HTML) ?? [])];
  await Promise.allSettled(
    assets.map(async (asset) => {
      if (!(await cache.match(asset))) {
        await cache.add(new Request(asset, { cache: "reload" }));
      }
    }),
  );
}

async function visitedPages() {
  const paths = new Set();
  for (const key of await caches.keys()) {
    if (!key.startsWith(CACHE_PREFIX) || key === CACHE) continue;
    const previous = await caches.open(key);
    for (const request of await previous.keys()) {
      const { pathname } = new URL(request.url);
      if (PAGE_PATH.test(pathname) && !HOME_PAGES.includes(pathname)) {
        paths.add(pathname);
      }
    }
  }
  return [...paths].slice(0, MAX_CARRIED_PAGES);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const page of HOME_PAGES) await cachePage(cache, page);
      await Promise.allSettled([
        ...STATIC_FILES.map((file) =>
          cache.add(new Request(file, { cache: "reload" })),
        ),
        ...(await visitedPages()).map((page) => cachePage(cache, page)),
      ]);
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
  const { type, urls } = event.data ?? {};
  if (type === "SKIP_WAITING") self.skipWaiting();
  if (type === "CACHE_PAGES" && Array.isArray(urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const paths = urls.filter(
          (url) => typeof url === "string" && PAGE_PATH.test(url),
        );
        for (const path of paths) {
          if (!(await cache.match(path))) {
            await cachePage(cache, path).catch(() => {});
          }
        }
      })(),
    );
  }
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

  if (url.pathname === "/") {
    const locale = await savedLocale();
    if (locale) return Response.redirect(`/${locale}`, 302);
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic" && !response.redirected) {
      await cache.put(url.pathname, response.clone());
    }
    return response;
  } catch (error) {
    const home = `/${(await savedLocale()) ?? defaultLocale}`;
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

async function savedLocale() {
  try {
    const cookie = await self.cookieStore?.get("NEXT_LOCALE");
    if (cookie && locales.includes(cookie.value)) return cookie.value;
  } catch {}
  return null;
}

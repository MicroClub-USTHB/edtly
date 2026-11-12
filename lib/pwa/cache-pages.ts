export function cachePages(urls: string[]) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) =>
      registration.active?.postMessage({ type: "CACHE_PAGES", urls }),
    )
    .catch(() => {});
}

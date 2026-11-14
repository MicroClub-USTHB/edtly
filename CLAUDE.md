# Edtly

Unofficial timetable PWA for USTHB Faculty of Informatics students. French is the default locale, English the second.

## Workflow

- Bun is the package manager and script runner; Next.js itself runs on Node (`bun --bun next build` crashes on Next 16.4).
- Before finishing, run `bun run lint`, `bun run typecheck` and `bun test`.
- Leave changes uncommitted: the user reviews and commits them.
- This is Next.js 16.4 with `cacheComponents`, `partialPrefetching` and `next/root-params`. Read the matching page in `node_modules/next/dist/docs/` before using a Next.js API.

## Code

- The code carries no comments: names, small functions and types explain it.
- One React component per file, as a named export (`export function SessionSheet`) in a kebab-case file named after it (`session-sheet.tsx`). Default exports appear only in Next.js route files (`page`, `layout`, `loading`, `route`…).
- Props with more than one field are a `type` alias named after the component, declared right above it (`type SessionSheetProps = { … }`); a single prop is typed inline.
- Anything from outside the code (data files, URL tokens, stored values) is validated with Zod or a sanitising reader before use.

## Structure

- `components/ui/`: generic primitives built the shadcn way without shadcn, with variants through `cva` and classes merged with `cn` from `lib/utils.ts`.
- `components/<feature>/` (`timetable`, `personal`, `filters`, `calendar`, `settings`, `academic`…): feature components. `providers/`: app-wide context providers.
- `lib/hooks/use-*.ts`: one hook per file.
- `lib/stores/`: client state on `useSyncExternalStore`. localStorage keys live in `lib/stores/storage-keys.ts` with the `edtly:` prefix, and every storage access sits in `try/catch` because storage can be blocked.
- `lib/timetable/` and `lib/calendar/`: pure logic, unit-tested in `tests/*.test.ts`.

## UI

- Icons come from `lucide-react` only.
- Animate with `m` from `motion/react-m`: `providers/motion-provider.tsx` runs `LazyMotion` in strict mode, so a `motion.*` component throws. Durations and easing come from `lib/motion.ts`.
- In-app navigation uses `Link` and `useTransitionRouter` from `next-view-transitions`, `usePathname` and `getPathname` from `@/i18n/navigation`, and paths built with `localized()`, `sectionPath()` and `parcoursPath()` from `lib/timetable/paths.ts`.
- Toasts go through `notify()` in `lib/notify.ts`, which lazy-loads Sonner; keep them rare.
- Every UI string exists in both `messages/fr.json` and `messages/en.json`, with identical keys.

## Tailwind CSS

- Always write the canonical form of a Tailwind class — the one Tailwind IntelliSense's `suggestCanonicalClasses` recommends. Use an arbitrary value only when no scale or theme class produces the same CSS.
  - Spacing, sizing and line-height use the 4px scale (`n × 0.25rem`): `leading-[34px]` → `leading-8.5`, `h-[72px]` → `h-18`, `leading-[48px]` → `leading-12`.
  - CSS variables use the shorthand: `bg-[var(--primary)]` → `bg-(--primary)`; prefer the theme token (`bg-primary`) when one exists.
  - Values with no scale equivalent stay arbitrary: `text-[28px]`, `tracking-[-0.01em]`.
- Use the brand tokens from `styles/globals.css` (`bg-primary`, `text-foreground-secondary`, `bg-tint`, `rounded-sheet`…) instead of raw hex values.
- Text sizes use the custom scale: `text-display`, `text-title`, `text-screen`, `text-heading`, `text-label`, `text-note`, `text-meta`, `text-overline`, `text-tab`. A new size also goes into the `font-size` group in `lib/utils.ts`, or `cn()` drops it when merging classes.
- The desktop layout starts at `lg`, redefined to 1280px in `styles/globals.css`; below it the mobile layout fills the width. `DESKTOP_QUERY` in `lib/hooks/use-media-query.ts` stays equal to that breakpoint.
- Horizontal page padding is `px-gutter` (12, 20 or 32px depending on width).

## Timetable data

- One file per programme at `data/<system>/<level>/<speciality>.json`, validated by `lib/timetable/schema.ts`. The app only reads these files; extracting them from the FINFO PDFs happens offline and stays out of the repo.
- The Full view shows every group: choosing a group changes the highlighting and keeps other groups' sessions visible.

## Next.js gotchas

- Each dynamic route segment gets a `loading.tsx`; without one, instant-navigation validation reports "URL data … outside `<Suspense>`".
- A route that reads `data/` at request time needs an entry in `outputFileTracingIncludes` in `next.config.ts`.
- The service worker (`lib/pwa/sw.js`) caches every same-origin navigation. Exclude new non-page routes there, as `/api/calendar/` is.

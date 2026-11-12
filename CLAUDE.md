# Tailwind CSS

- Always write the canonical form of a Tailwind class — the one Tailwind IntelliSense's `suggestCanonicalClasses` recommends. Use an arbitrary value only when no scale or theme class produces the same CSS.
  - Spacing, sizing and line-height use the 4px scale (`n × 0.25rem`): `leading-[34px]` → `leading-8.5`, `h-[72px]` → `h-18`, `leading-[48px]` → `leading-12`.
  - CSS variables use the shorthand: `bg-[var(--primary)]` → `bg-(--primary)`; prefer the theme token (`bg-primary`) when one exists.
  - Values with no scale equivalent stay arbitrary: `text-[28px]`, `tracking-[-0.01em]`.
- Use the brand tokens from `styles/globals.css` (`bg-primary`, `text-foreground-secondary`, `bg-tint`, `rounded-sheet`…) instead of raw hex values.

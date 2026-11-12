"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const names = { en: "English", fr: "Français" } as const;

export function LangToggle() {
  const t = useTranslations("Toggles");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex gap-1 rounded-full bg-muted p-1"
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-label={names[l]}
            aria-pressed={active}
            disabled={pending}
            onClick={() =>
              startTransition(() => router.replace(pathname, { locale: l }))
            }
            className={`h-9 min-w-11 rounded-full px-3 text-sm uppercase transition-colors duration-120 ease-out ${
              active
                ? "bg-tint text-tint-foreground"
                : "text-foreground-secondary hover:bg-muted-hover"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LOCALE_KEY, VIEW_ONCE_KEY } from "@/lib/stores/storage-keys";

const names = { en: "English", fr: "Français" } as const;

type Locale = (typeof routing.locales)[number];

type LangToggleProps = {
  id: string;
  size: "md" | "icon";
};

export function LangToggle({ id, size }: LangToggleProps) {
  const t = useTranslations("Toggles");
  const locale = useLocale();
  const pathname = usePathname();

  const change = (next: Locale) => {
    if (next === locale) return;
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
      window.sessionStorage.setItem(
        VIEW_ONCE_KEY,
        document.documentElement.dataset.view ?? "day",
      );
    } catch {}
    window.location.assign(
      getPathname({ href: pathname, locale: next }) + window.location.hash,
    );
  };

  return (
    <SegmentedControl
      id={id}
      label={t("language")}
      size={size}
      value={locale as Locale}
      onChange={change}
      options={routing.locales.map((value) => ({
        value,
        ariaLabel: names[value],
        label:
          size === "icon" ? (
            <span className="text-xs uppercase">{value}</span>
          ) : (
            names[value]
          ),
      }))}
    />
  );
}

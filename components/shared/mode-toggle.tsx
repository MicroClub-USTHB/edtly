"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMounted } from "@/lib/hooks/use-mounted";

const themes = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const;

type ThemeName = (typeof themes)[number]["value"];

type ModeToggleProps = {
  id: string;
  variant: "icons" | "labels";
};

export function ModeToggle({ id, variant }: ModeToggleProps) {
  const t = useTranslations("Toggles");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const change = (next: ThemeName) => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    const root = document.documentElement;
    root.dataset.themeSwitch = "";
    document
      .startViewTransition(() => flushSync(() => setTheme(next)))
      .finished.finally(() => {
        delete root.dataset.themeSwitch;
      });
  };

  return (
    <SegmentedControl
      id={id}
      label={t("appearance")}
      size={variant === "icons" ? "icon" : "md"}
      value={mounted ? ((theme as ThemeName | undefined) ?? null) : null}
      onChange={change}
      options={themes.map(({ value, Icon }) =>
        variant === "icons"
          ? {
              value,
              ariaLabel: t(value),
              label: <Icon size={16} strokeWidth={1.75} aria-hidden="true" />,
            }
          : { value, label: t(value) },
      )}
    />
  );
}

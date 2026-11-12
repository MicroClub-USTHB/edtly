"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

const themes = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const;

export function ModeToggle() {
  const t = useTranslations("Toggles");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  return (
    <div
      role="group"
      aria-label={t("appearance")}
      className="flex gap-1 rounded-full bg-muted p-1"
    >
      {themes.map(({ value, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={t(value)}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={`flex size-9 items-center justify-center rounded-full transition-colors duration-120 ease-out ${
              active
                ? "bg-tint text-tint-foreground"
                : "text-foreground-secondary hover:bg-muted-hover"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

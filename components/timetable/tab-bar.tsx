"use client";

import { Columns3, Rows3, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { setView, useView, type View } from "@/lib/stores/view-store";
import { cn } from "@/lib/utils";

const tabs = [
  { view: "day", Icon: Rows3 },
  { view: "week", Icon: Columns3 },
  { view: "settings", Icon: Settings2 },
] as const satisfies readonly { view: View; Icon: typeof Rows3 }[];

export function TabBar() {
  const t = useTranslations("Tabs");
  const current = useView();

  return (
    <nav
      aria-label={t("label")}
      className="sticky bottom-0 mt-auto flex border-t border-divider bg-background px-3 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
    >
      {tabs.map(({ view, Icon }) => {
        const active = view === current;
        return (
          <button
            key={view}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => {
              setView(view);
              window.scrollTo({ top: 0 });
            }}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.75 rounded-chip transition-colors duration-120 ease-out motion-reduce:transition-none",
              active
                ? "text-primary"
                : "text-foreground-muted hover:text-foreground active:text-foreground",
            )}
          >
            <Icon
              size={26}
              strokeWidth={active ? 2.2 : 1.7}
              aria-hidden="true"
            />
            <span className="text-tab">{t(view)}</span>
          </button>
        );
      })}
    </nav>
  );
}

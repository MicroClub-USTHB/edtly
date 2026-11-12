"use client";

import { useTranslations } from "next-intl";
import { LangToggle } from "@/components/shared/lang-toggle";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { SheetAnchor } from "@/components/ui/sheet";
import {
  setStartView,
  useStartView,
  type StartView,
} from "@/lib/stores/preferences";
import { SettingsSection } from "./settings-section";

type SettingsPanelProps = {
  parcours: string;
  version: string;
  onEditParcours: (anchor: SheetAnchor) => void;
};

export function SettingsPanel({
  parcours,
  version,
  onEditParcours,
}: SettingsPanelProps) {
  const t = useTranslations("Settings");
  const tabs = useTranslations("Tabs");
  const startView = useStartView();

  return (
    <div data-view-panel="settings" className="flex-1 flex-col">
      <h2 className="px-gutter pt-7 text-screen">{t("title")}</h2>

      <div className="flex flex-col gap-6 px-gutter pt-6">
        <SettingsSection label={t("appearance")}>
          <ModeToggle id="theme-settings" variant="labels" />
        </SettingsSection>

        <SettingsSection label={t("startView")}>
          <SegmentedControl<StartView>
            id="start-view"
            label={t("startViewLabel")}
            value={startView}
            onChange={setStartView}
            options={[
              { value: "day", label: tabs("day") },
              { value: "week", label: tabs("week") },
            ]}
          />
        </SettingsSection>

        <SettingsSection label={t("language")}>
          <LangToggle id="lang-settings" size="md" />
        </SettingsSection>

        <SettingsSection label={t("parcours")} dense>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={(event) =>
              onEditParcours(event.currentTarget.getBoundingClientRect())
            }
            className="flex min-h-14 items-center justify-between gap-3 border-b border-divider py-2 text-left text-label"
          >
            <span className="min-w-0 wrap-anywhere">{parcours}</span>
            <span className="shrink-0 text-primary">{t("edit")}</span>
          </button>
        </SettingsSection>
      </div>

      <p className="mt-auto px-gutter pt-8 pb-3.5 text-meta leading-4.25 text-foreground-muted">
        {t("disclaimer", { version })}
      </p>
    </div>
  );
}

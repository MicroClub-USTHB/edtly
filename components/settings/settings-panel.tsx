"use client";

import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { LangToggle } from "@/components/shared/lang-toggle";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { SheetAnchor } from "@/components/ui/sheet";
import { notify } from "@/lib/notify";
import { checkForUpdate } from "@/lib/pwa/update-store";
import {
  setStartView,
  useStartView,
  type StartView,
} from "@/lib/stores/preferences";
import { SettingsSection } from "./settings-section";

type SettingsPanelProps = {
  parcours: string;
  updated: string;
  pdfUrl: string;
  version: string;
  onEditParcours: (anchor: SheetAnchor) => void;
};

const ROW =
  "flex min-h-13 items-center justify-between gap-3 border-b border-divider py-2 text-left text-label";

export function SettingsPanel({
  parcours,
  updated,
  pdfUrl,
  version,
  onEditParcours,
}: SettingsPanelProps) {
  const t = useTranslations("Settings");
  const tabs = useTranslations("Tabs");
  const pwa = useTranslations("Pwa");
  const startView = useStartView();

  const check = async () => {
    const result = await checkForUpdate();
    if (result === "failed") void notify("error", pwa("checkFailed"));
    else {
      void notify(
        "success",
        result === "updated" ? pwa("updated") : pwa("upToDate"),
      );
    }
  };

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
            className={`${ROW} min-h-14`}
          >
            <span className="min-w-0 wrap-anywhere">{parcours}</span>
            <span className="shrink-0 text-primary">{t("edit")}</span>
          </button>
        </SettingsSection>

        <SettingsSection label={t("timetable")} dense>
          <div className="flex flex-col">
            {updated && (
              <p className={ROW}>
                <span>{t("lastUpdate")}</span>
                <span className="text-sm text-foreground-secondary">
                  {updated}
                </span>
              </p>
            )}

            <button type="button" onClick={check} className={ROW}>
              {t("checkNow")}
              <RefreshCw
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="shrink-0 text-foreground-secondary"
              />
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className={`${ROW} border-b-0`}
            >
              {t("officialPdf")}
              <ArrowUpRight
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-foreground-secondary"
              />
            </a>
          </div>
        </SettingsSection>
      </div>

      <p className="mt-auto px-gutter pt-8 pb-3.5 text-meta leading-4.25 text-foreground-muted">
        {t("disclaimer", { version })}
      </p>
    </div>
  );
}

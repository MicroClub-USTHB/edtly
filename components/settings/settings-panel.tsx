"use client";

import { CalendarClock, CalendarPlus, RotateCcw } from "lucide-react";
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
  personalSummary: string;
  customized: boolean;
  onEditParcours: (anchor: SheetAnchor) => void;
  onCustomize: (anchor: SheetAnchor) => void;
  onReset: () => void;
  onCalendar?: (anchor: SheetAnchor) => void;
  changeCount: number;
  onChanges?: (anchor: SheetAnchor) => void;
};

const ROW =
  "flex items-center justify-between gap-3 border-b border-divider py-2 text-left text-label";

export function SettingsPanel({
  parcours,
  version,
  personalSummary,
  customized,
  onEditParcours,
  onCustomize,
  onReset,
  onCalendar,
  changeCount,
  onChanges,
}: SettingsPanelProps) {
  const t = useTranslations("Settings");
  const overrides = useTranslations("Overrides");
  const calendar = useTranslations("Calendar");
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
            className={`${ROW} min-h-14`}
          >
            <span className="min-w-0 wrap-anywhere">{parcours}</span>
            <span className="shrink-0 text-primary">{t("edit")}</span>
          </button>
        </SettingsSection>

        <SettingsSection label={t("personal")} dense>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={(event) =>
              onCustomize(event.currentTarget.getBoundingClientRect())
            }
            className={`${ROW} min-h-14`}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{t("modules")}</span>
              <span className="text-meta wrap-anywhere text-foreground-muted">
                {personalSummary}
              </span>
            </span>
            <span className="shrink-0 text-primary">{t("customize")}</span>
          </button>

          {onCalendar && (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) =>
                onCalendar(event.currentTarget.getBoundingClientRect())
              }
              className={`${ROW} min-h-14`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{calendar("open")}</span>
                <span className="text-meta wrap-anywhere text-foreground-muted">
                  {calendar("settingsHint")}
                </span>
              </span>
              <CalendarPlus
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="shrink-0 text-primary"
              />
            </button>
          )}

          {onChanges && (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) =>
                onChanges(event.currentTarget.getBoundingClientRect())
              }
              className={`${ROW} min-h-14`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{overrides("changesTitle")}</span>
                <span className="text-meta wrap-anywhere text-foreground-muted">
                  {changeCount > 0
                    ? overrides("changesCount", { count: changeCount })
                    : overrides("changesHint")}
                </span>
              </span>
              <CalendarClock
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="shrink-0 text-primary"
              />
            </button>
          )}

          <button
            type="button"
            aria-disabled={!customized}
            onClick={onReset}
            className={`${ROW} min-h-13 border-b-0 aria-disabled:pointer-events-none aria-disabled:text-foreground-muted`}
          >
            {t("reset")}
            <RotateCcw
              size={18}
              strokeWidth={1.6}
              aria-hidden="true"
              className="shrink-0"
            />
          </button>
        </SettingsSection>
      </div>

      <p className="mt-auto px-gutter pt-8 pb-3.5 text-meta leading-4.25 text-foreground-muted">
        {t("disclaimer", { version })}
      </p>
    </div>
  );
}

"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActiveFilters } from "@/components/filters/active-filters";
import { CalendarButton } from "@/components/calendar/calendar-button";
import { FilterButton } from "@/components/filters/filter-button";
import { MineEmpty } from "@/components/personal/mine-empty";
import { ModeSwitch } from "@/components/personal/mode-switch";
import { StatusBanner } from "@/components/pwa/status-banner";
import { Disclaimer } from "@/components/shared/disclaimer";
import { Button } from "@/components/ui/button";
import { DesktopHeader } from "./desktop-header";
import { DesktopToolbar } from "./desktop-toolbar";
import { DesktopWeek } from "./desktop-week";
import { GroupSwitch } from "./group-switch";
import { NowNext } from "./now-next";
import { ParcoursButton } from "./parcours-button";
import { SectionEmpty } from "./section-empty";
import type { TimetableModel } from "./timetable-model";
import { WeekLegend } from "./week-legend";

export function TimetableDesktop({ model }: { model: TimetableModel }) {
  const t = useTranslations("Timetable");
  const personal = useTranslations("Personal");
  const mineMode = model.mode === "mine";

  return (
    <div className="hidden min-h-dvh flex-col gap-5 px-8 pt-5 pb-8 lg:flex">
      <DesktopHeader updated={model.updatedShort} pdfUrl={model.pdfUrl}>
        <ParcoursButton
          label={[model.programmeLabel, model.sectionLabel]
            .filter(Boolean)
            .join(" · ")}
          onOpen={model.onParcours}
        />

        {!model.empty && <ModeSwitch id="mode-desktop" size="compact" />}

        {mineMode && !model.empty ? (
          <Button
            variant="soft"
            size="sm"
            aria-haspopup="dialog"
            onClick={(event) =>
              model.onCustomize(event.currentTarget.getBoundingClientRect())
            }
          >
            <SlidersHorizontal
              size={15}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {personal("customize")}
          </Button>
        ) : (
          <GroupSwitch
            id="group-desktop"
            size="sm"
            groups={model.groups}
            value={model.group}
            onChange={model.onGroupChange}
          />
        )}
      </DesktopHeader>

      <StatusBanner />

      {model.empty ? (
        <div className="pt-12">
          <SectionEmpty
            programme={[model.programmeLabel, model.sectionLabel]
              .filter(Boolean)
              .join(", ")}
            onChangeSection={model.onParcours}
          />
        </div>
      ) : (
        <div data-mode-body={model.mode} className="flex flex-col gap-5">
          <DesktopToolbar
            week={model.week}
            onShift={model.onShiftWeek}
            onToday={model.onToday}
          >
            <ActiveFilters
              labels={model.filterLabels}
              onClear={model.onClearFilters}
              className="mr-2"
            />
            <CalendarButton variant="label" onOpen={model.onCalendar} />
            <FilterButton
              variant="label"
              count={model.filterCount}
              onOpen={model.onFilters}
            />
          </DesktopToolbar>

          {model.mineEmpty ? (
            <div className="pt-12">
              <MineEmpty onCustomize={() => model.onCustomize()} />
            </div>
          ) : (
            <>
              {model.status &&
                model.weekOffset === 0 &&
                model.todayIndex !== null && (
                  <NowNext
                    layout="row"
                    status={model.status}
                    todayIndex={model.todayIndex}
                    group={model.labelGroup}
                    onOpen={model.onOpen}
                  />
                )}

              <DesktopWeek
                sessions={model.sessions}
                group={model.labelGroup}
                mine={model.mine}
                week={model.week}
                days={model.days}
                conflicts={model.conflicts}
                changed={model.changed}
                onOpen={model.onOpen}
              />

              <WeekLegend
                className="gap-5 text-note"
                mine={
                  mineMode
                    ? personal("legend")
                    : model.labelGroup &&
                      t("legendMine", { group: model.labelGroup })
                }
                cours={t("legendCours")}
                others={
                  !mineMode && model.groups.length > 1
                    ? t("legendOthers")
                    : null
                }
              />
            </>
          )}
        </div>
      )}

      <Disclaimer className="mt-auto border-t border-divider pt-5" />
    </div>
  );
}

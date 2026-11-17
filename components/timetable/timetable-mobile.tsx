"use client";

import { useTranslations } from "next-intl";
import { ActiveFilters } from "@/components/filters/active-filters";
import { CalendarButton } from "@/components/calendar/calendar-button";
import { FilterButton } from "@/components/filters/filter-button";
import { TimetableDnd } from "@/components/overrides/timetable-dnd";
import { MineEmpty } from "@/components/personal/mine-empty";
import { StatusBanner } from "@/components/pwa/status-banner";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { setDay } from "@/lib/stores/view-store";
import { DayPanels } from "./day-panels";
import { DayStrip } from "./day-strip";
import { DayTitle } from "./day-title";
import { MobileControls } from "./mobile-controls";
import { MobileHeader } from "./mobile-header";
import { ParcoursButton } from "./parcours-button";
import { SectionEmpty } from "./section-empty";
import { TabBar } from "./tab-bar";
import type { TimetableModel } from "./timetable-model";
import { WeekGrid } from "./week-grid";
import { WeekLegend } from "./week-legend";
import { WeekTitle } from "./week-title";

export function TimetableMobile({ model }: { model: TimetableModel }) {
  const t = useTranslations("Timetable");
  const types = useTranslations("SessionTypes");
  const personal = useTranslations("Personal");
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const mineMode = model.mode === "mine";

  return (
    <TimetableDnd
      enabled={!desktop && model.dndEnabled}
      conflictAt={model.conflictAt}
      onMove={model.onMove}
      onHoverDay={setDay}
    >
    <div className="flex min-h-dvh w-full flex-col lg:hidden">
      <MobileHeader>
        <div className="flex min-w-0 items-center gap-2">
          {!model.empty && (
            <>
              <CalendarButton
                variant="icon"
                onOpen={model.onCalendar}
                className="max-[359px]:hidden"
              />
              <FilterButton
                variant="icon"
                count={model.filterCount}
                onOpen={model.onFilters}
              />
            </>
          )}
          <ParcoursButton
            label={[model.programmeLabel, model.sectionName]
              .filter(Boolean)
              .join(" · ")}
            onOpen={model.onParcours}
          />
        </div>
      </MobileHeader>

      <StatusBanner />

      {model.empty ? (
        <div data-view-panel="day week" className="px-gutter pt-10">
          <SectionEmpty
            programme={[model.programmeLabel, model.sectionLabel]
              .filter(Boolean)
              .join(", ")}
            onChangeSection={model.onParcours}
          />
        </div>
      ) : (
        <>
          <DayTitle
            week={model.week}
            weekOffset={model.weekOffset}
            todayIndex={model.todayIndex}
            onToday={model.onToday}
          />
          <WeekTitle
            week={model.week}
            weekOffset={model.weekOffset}
            onShift={model.onShiftWeek}
            onToday={model.onToday}
          />

          <MobileControls
            mode={model.mode}
            groups={model.groups}
            group={model.group}
            tpGroups={model.tpGroups}
            tpGroup={model.tpGroup}
            summary={model.summary}
            onGroupChange={model.onGroupChange}
            onTpGroupChange={model.onTpGroupChange}
            onCustomize={() => model.onCustomize()}
          />

          {model.filtered && (
            <div data-view-panel="day week" className="flex-col px-gutter">
              <ActiveFilters
                labels={model.filterLabels}
                onClear={model.onClearFilters}
              />
            </div>
          )}

          <div data-mode-body={model.mode} className="contents">
            {model.mineEmpty ? (
              <div data-view-panel="day week" className="px-gutter pt-8">
                <MineEmpty onCustomize={() => model.onCustomize()} />
              </div>
            ) : (
              <>
                <DayStrip week={model.week} days={model.days} />
                <DayPanels
                  sessions={model.sessions}
                  group={model.labelGroup}
                  mine={model.mine}
                  week={model.week}
                  weekOffset={model.weekOffset}
                  status={model.status}
                  conflicts={model.conflicts}
                  showGaps={!model.filtered}
                  filtered={model.filtered}
                  changed={model.changed}
                  editable={model.editable}
                  onOpen={model.onOpen}
                  onStep={model.onStepDay}
                  onClearFilters={model.onClearFilters}
                />

                <WeekGrid
                  sessions={model.sessions}
                  mine={model.mine}
                  week={model.week}
                  days={model.days}
                  conflicts={model.conflicts}
                  editable={model.editable}
                  onOpen={model.onOpen}
                />
                <div data-view-panel="week" className="px-gutter pb-3">
                  <WeekLegend
                    className="gap-x-3.5 gap-y-1 text-xs"
                    mine={mineMode ? personal("legend") : model.mineLabel}
                    cours={types("cours")}
                    others={
                      !mineMode && model.groups.length > 1
                        ? t("legendOthersCount")
                        : null
                    }
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      <SettingsPanel
        parcours={model.parcoursLabel}
        version={model.version}
        personalSummary={model.summary}
        customized={model.customized}
        onEditParcours={model.onParcours}
        onCustomize={() => model.onCustomize()}
        onReset={model.onReset}
        onCalendar={model.empty ? undefined : model.onCalendar}
        changeCount={model.changeCount}
        onChanges={model.empty ? undefined : model.onChanges}
      />

      <TabBar />
    </div>
    </TimetableDnd>
  );
}

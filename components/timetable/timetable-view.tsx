"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect, useState } from "react";
import { StatusBanner } from "@/components/pwa/status-banner";
import { Disclaimer } from "@/components/shared/disclaimer";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import type { SheetAnchor } from "@/components/ui/sheet";
import { StateBlock } from "@/components/ui/state-block";
import { minutesNow } from "@/lib/dates";
import { useWeek } from "@/lib/hooks/use-week";
import { cachePages } from "@/lib/pwa/cache-pages";
import { trackSessions, useChangedSessions } from "@/lib/stores/changes-store";
import {
  readParcours,
  saveParcours,
  useSavedParcours,
} from "@/lib/stores/preferences";
import {
  groupSlug,
  localized,
  parcoursPath,
  sectionPath,
} from "@/lib/timetable/paths";
import {
  daySlots,
  sessionKey,
  slotSessions,
  slotStatuses,
  type Slot,
} from "@/lib/timetable/schedule";
import {
  DAYS,
  type CatalogueProgramme,
  type Parcours,
  type ProgrammeInfo,
  type Section,
} from "@/lib/timetable/types";
import { DayPanels } from "./day-panels";
import { DayStrip } from "./day-strip";
import { DayTitle } from "./day-title";
import { DesktopHeader } from "./desktop-header";
import { DesktopToolbar } from "./desktop-toolbar";
import { DesktopWeek } from "./desktop-week";
import { GroupSwitch } from "./group-switch";
import { MobileHeader } from "./mobile-header";
import { ParcoursButton } from "./parcours-button";
import { ParcoursSheet } from "./parcours-sheet";
import { SessionSheet } from "./session-sheet";
import { TabBar } from "./tab-bar";
import { WeekGrid } from "./week-grid";
import { WeekLegend } from "./week-legend";
import { WeekTitle } from "./week-title";

type TimetableViewProps = {
  programme: ProgrammeInfo;
  section: Section;
  catalogue: CatalogueProgramme[];
  programmeLabel: string;
  updatedShort: string;
  version: string;
};

type DetailRequest = Slot & {
  dayIndex: number;
  focus: string | null;
  anchor: SheetAnchor;
};

export function TimetableView({
  programme,
  section,
  catalogue,
  programmeLabel,
  updatedShort,
  version,
}: TimetableViewProps) {
  const t = useTranslations("Timetable");
  const states = useTranslations("States");
  const types = useTranslations("SessionTypes");
  const locale = useLocale();
  const router = useTransitionRouter();
  const saved = useSavedParcours();
  const changed = useChangedSessions();
  const week = useWeek();
  const [weekOffset, setWeekOffset] = useState(0);
  const shiftedWeek = useWeek(weekOffset);
  const pathname = usePathname();
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<SheetAnchor | null>(null);

  const { system, level, speciality, source } = programme;
  const { id: sectionId, groups, sessions } = section;
  const base = { system, level, speciality: speciality.id, section: sectionId };
  const basePath = sectionPath(base);
  const savedHere = saved && sectionPath(saved) === basePath ? saved : null;
  const savedGroup =
    savedHere?.group && groups.includes(savedHere.group)
      ? savedHere.group
      : null;
  const urlGroup =
    groups.find((name) => pathname === `${basePath}/${groupSlug(name)}`) ??
    null;
  const group = urlGroup ?? savedGroup ?? groups[0] ?? null;
  const parcours: Parcours = { ...base, group };
  const empty = sessions.length === 0;

  const sectionName = programme.sectionCount > 1 ? section.name : "";
  const sectionLabel = sectionName && t("sectionLabel", { name: sectionName });
  const groupNumber = group?.match(/^G(\d+)$/)?.[1];
  const groupLabel = groupNumber
    ? t("groupLabel", { name: groupNumber })
    : group;

  useEffect(() => {
    if (readParcours()) return;
    saveParcours({
      system,
      level,
      speciality: speciality.id,
      section: sectionId,
      group,
    });
  }, [system, level, speciality.id, sectionId, group]);

  useEffect(() => {
    const here = {
      system,
      level,
      speciality: speciality.id,
      section: sectionId,
    };
    cachePages(
      [
        sectionPath(here),
        ...groups.map((name) => parcoursPath({ ...here, group: name })),
      ].map((path) => localized(locale, path)),
    );
  }, [system, level, speciality.id, sectionId, groups, locale]);

  useEffect(() => {
    trackSessions(basePath, source.updatedAt, sessions.map(sessionKey));
  }, [basePath, source.updatedAt, sessions]);

  const selectGroup = (next: string) => {
    const nextParcours = { ...base, group: next };
    if (!saved || savedHere) saveParcours(nextParcours);
    window.history.replaceState(
      null,
      "",
      localized(locale, parcoursPath(nextParcours)),
    );
  };

  const submitParcours = (next: Parcours) => {
    setPickerAnchor(null);
    saveParcours(next);
    if (sectionPath(next) !== basePath) {
      router.push(localized(locale, parcoursPath(next)));
    } else if (next.group && next.group !== group) {
      selectGroup(next.group);
    }
  };

  const openSlot = (
    dayIndex: number,
    slot: Slot,
    anchor: SheetAnchor,
    focus: string | null = null,
  ) => setDetail({ dayIndex, start: slot.start, end: slot.end, focus, anchor });

  const detailDay = detail ? DAYS[detail.dayIndex] : null;
  const detailStatus =
    detail && detailDay && week.now && week.today === detail.dayIndex
      ? slotStatuses(
          daySlots(sessions, detailDay, group),
          minutesNow(week.now),
        ).get(detail.start)
      : undefined;

  const emptyState = (
    <StateBlock
      title={states("emptyTitle")}
      description={states("emptyBody", {
        programme: [programmeLabel, sectionLabel].filter(Boolean).join(", "),
      })}
    >
      <Button
        variant="outline"
        aria-haspopup="dialog"
        onClick={(event) =>
          setPickerAnchor(event.currentTarget.getBoundingClientRect())
        }
      >
        {states("changeSection")}
      </Button>
    </StateBlock>
  );

  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-140 flex-col lg:hidden">
        <MobileHeader>
          <ParcoursButton
            label={[programmeLabel, sectionName].filter(Boolean).join(" · ")}
            onOpen={setPickerAnchor}
          />
        </MobileHeader>

        <StatusBanner />

        {empty ? (
          <div data-view-panel="day week" className="px-gutter pt-10">
            {emptyState}
          </div>
        ) : (
          <>
            <DayTitle week={week} />
            <WeekTitle week={week} />

            {groups.length > 1 && (
              <div data-view-panel="day week" className="flex-col px-gutter pt-3.5">
                <GroupSwitch
                  id="group-mobile"
                  groups={groups}
                  value={group}
                  onChange={selectGroup}
                />
              </div>
            )}

            <DayStrip week={week} />
            <DayPanels
              sessions={sessions}
              group={group}
              week={week}
              changed={changed}
              onOpen={openSlot}
            />

            <WeekGrid
              sessions={sessions}
              group={group}
              week={week}
              onOpen={openSlot}
            />
            <div data-view-panel="week" className="px-gutter pb-3">
              <WeekLegend
                className="gap-x-3.5 gap-y-1 text-xs"
                mine={group}
                cours={types("cours")}
                others={groups.length > 1 ? t("legendOthersCount") : null}
              />
            </div>
          </>
        )}

        <SettingsPanel
          parcours={[programmeLabel, sectionLabel, groupLabel]
            .filter(Boolean)
            .join(" · ")}
          version={version}
          onEditParcours={setPickerAnchor}
        />

        <TabBar />
      </div>

      <div className="hidden min-h-dvh flex-col gap-5 px-8 pt-5 pb-8 lg:flex">
        <DesktopHeader updated={updatedShort} pdfUrl={source.url}>
          <ParcoursButton
            label={[programmeLabel, sectionLabel].filter(Boolean).join(" · ")}
            onOpen={setPickerAnchor}
          />
          <GroupSwitch
            id="group-desktop"
            size="sm"
            groups={groups}
            value={group}
            onChange={selectGroup}
          />
        </DesktopHeader>

        <StatusBanner />

        {empty ? (
          <div className="pt-12">{emptyState}</div>
        ) : (
          <>
            <DesktopToolbar
              week={shiftedWeek}
              onShift={(delta) => setWeekOffset((offset) => offset + delta)}
              onToday={() => setWeekOffset(0)}
            />

            <DesktopWeek
              sessions={sessions}
              group={group}
              week={shiftedWeek}
              changed={changed}
              onOpen={openSlot}
            />

            <WeekLegend
              className="gap-5 text-note"
              mine={group && t("legendMine", { group })}
              cours={t("legendCours")}
              others={groups.length > 1 ? t("legendOthers") : null}
            />
          </>
        )}

        <Disclaimer className="mt-auto border-t border-divider pt-5" />
      </div>

      <SessionSheet
        detail={
          detail && detailDay
            ? {
                day: detailDay,
                slot: slotSessions(sessions, detailDay, detail, group),
                focus: detail.focus,
                status: detailStatus,
                anchor: detail.anchor,
              }
            : null
        }
        group={group}
        sectionName={sectionName}
        pdfUrl={source.url}
        onFocus={(focus) => setDetail(detail && { ...detail, focus })}
        onClose={() => setDetail(null)}
      />

      <ParcoursSheet
        open={pickerAnchor !== null}
        anchor={pickerAnchor}
        catalogue={catalogue}
        current={parcours}
        onSubmit={submitParcours}
        onClose={() => setPickerAnchor(null)}
      />
    </>
  );
}

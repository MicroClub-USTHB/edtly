"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect, useState } from "react";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { PersonalSheet } from "@/components/personal/personal-sheet";
import type { SheetAnchor } from "@/components/ui/sheet";
import { usePathname } from "@/i18n/navigation";
import { minutesNow, todayIndex } from "@/lib/dates";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { usePersonalSummary } from "@/lib/hooks/use-personal-summary";
import { usePersonalTimetable } from "@/lib/hooks/use-personal-timetable";
import { useResetPersonal } from "@/lib/hooks/use-reset-personal";
import { useWeek } from "@/lib/hooks/use-week";
import { cachePages } from "@/lib/pwa/cache-pages";
import { trackSessions, useChangedSessions } from "@/lib/stores/changes-store";
import {
  readParcours,
  saveParcours,
  useSavedParcours,
} from "@/lib/stores/preferences";
import { setDay, useSelectedDay } from "@/lib/stores/view-store";
import {
  activeFilterCount,
  filterSessions,
  NO_FILTERS,
  pruneFilters,
  visibleDays,
  type Filters,
} from "@/lib/timetable/filters";
import {
  groupSlug,
  localized,
  parcoursPath,
  sectionPath,
} from "@/lib/timetable/paths";
import {
  isCustomized,
  matcherFor,
  mergeSessions,
  modulesOf,
} from "@/lib/timetable/personal";
import {
  conflictPairs,
  conflictsOf,
  dayStatus,
  daySlots,
  forGroup,
  forGroups,
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
import { ParcoursSheet } from "./parcours-sheet";
import { SessionSheet } from "./session-sheet";
import { TimetableDesktop } from "./timetable-desktop";
import { TimetableMobile } from "./timetable-mobile";
import type { TimetableModel } from "./timetable-model";

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

type SheetRequest = { anchor: SheetAnchor | null };

export function TimetableView({
  programme,
  section,
  catalogue,
  programmeLabel,
  updatedShort,
  version,
}: TimetableViewProps) {
  const t = useTranslations("Timetable");
  const types = useTranslations("SessionTypes");
  const short = useTranslations("Days.short");
  const locale = useLocale();
  const router = useTransitionRouter();
  const saved = useSavedParcours();
  const changed = useChangedSessions();
  const pathname = usePathname();
  const summarize = usePersonalSummary();
  const selectedDay = useSelectedDay();
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useWeek();
  const shiftedWeek = useWeek(weekOffset);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<SheetAnchor | null>(null);
  const [personalSheet, setPersonalSheet] = useState<SheetRequest | null>(null);
  const [filterSheet, setFilterSheet] = useState<SheetRequest | null>(null);

  const { system, level, speciality, source } = programme;
  const { id: sectionId, groups, sessions } = section;
  const base = { system, level, speciality: speciality.id, section: sectionId };
  const basePath = sectionPath(base);
  const resetPersonal = useResetPersonal(basePath);
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

  const { mode, personal, entries, mySessions } = usePersonalTimetable(
    basePath,
    sessions,
    group,
  );
  const mineMode = mode === "mine";
  const ownSessions = mineMode ? mySessions : sessions;
  const ownMatcher = mineMode ? matcherFor(mySessions) : forGroup(group);
  const moduleNames = modulesOf(ownSessions).map(({ name }) => name);
  const filterGroups = mineMode ? [] : groups;
  const active = pruneFilters(filters, moduleNames, filterGroups);
  const filterCount = activeFilterCount(active);
  const visible = filterSessions(ownSessions, active);
  const days = visibleDays(active);
  const mine =
    !mineMode && active.groups.length > 0
      ? forGroups(active.groups)
      : ownMatcher;
  const labelGroup = mineMode
    ? null
    : active.groups.length > 0
      ? active.groups.length === 1
        ? active.groups[0]
        : null
      : group;
  const conflicts = conflictsOf(ownSessions, ownMatcher);
  const status =
    week.now && week.today !== null
      ? dayStatus(ownSessions, week.today, ownMatcher, minutesNow(week.now))
      : null;
  const extrasLoading = personal.extras.some(
    (extra) => entries.get(sectionPath(extra))?.status !== "ready",
  );
  const mineEmpty = mineMode && mySessions.length === 0 && !extrasLoading;

  const sectionName = programme.sectionCount > 1 ? section.name : "";
  const sectionLabel = sectionName && t("sectionLabel", { name: sectionName });
  const groupNumber = group?.match(/^G(\d+)$/)?.[1];
  const groupLabel = groupNumber
    ? t("groupLabel", { name: groupNumber })
    : group;
  const filterLabels = [
    ...active.types.map((type) => types(type)),
    ...DAYS.filter((day) => active.days.includes(day)).map((day) => short(day)),
    ...active.groups,
    ...active.modules,
  ];
  const daysKey = days.join(",");

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

  useEffect(() => {
    const allowed = daysKey.split(",").map(Number);
    if (selectedDay !== null && !allowed.includes(selectedDay)) {
      setDay(allowed[0]);
    }
  }, [daysKey, selectedDay]);

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

  const shiftWeek = (delta: number) =>
    setWeekOffset((offset) => offset + delta);

  const goToday = () => {
    setWeekOffset(0);
    setDay(todayIndex(new Date()) ?? days[0]);
  };

  const stepDay = (direction: 1 | -1) => {
    const position = days.indexOf(selectedDay ?? days[0]);
    const next = position + direction;
    if (position !== -1 && next >= 0 && next < days.length) {
      setDay(days[next]);
      return;
    }
    shiftWeek(direction);
    setDay(direction > 0 ? days[0] : days[days.length - 1]);
  };

  useKeyboardNavigation({
    onDay: stepDay,
    onWeek: shiftWeek,
    onToday: goToday,
  });

  const detailDay = detail ? DAYS[detail.dayIndex] : null;
  const detailSessions = mineMode
    ? mergeSessions(mySessions, sessions)
    : sessions;
  const detailStatus =
    detail &&
    detailDay &&
    weekOffset === 0 &&
    week.now &&
    week.today === detail.dayIndex
      ? slotStatuses(
          daySlots(visible, detailDay, mine),
          minutesNow(week.now),
        ).get(detail.start)
      : undefined;

  const model: TimetableModel = {
    empty: sessions.length === 0,
    mode,
    mineEmpty,
    programmeLabel,
    sectionName,
    sectionLabel,
    parcoursLabel: [programmeLabel, sectionLabel, groupLabel]
      .filter(Boolean)
      .join(" · "),
    updatedShort,
    version,
    pdfUrl: source.url,
    groups,
    group,
    labelGroup,
    sessions: visible,
    mine,
    conflicts,
    changed,
    week: shiftedWeek,
    weekOffset,
    todayIndex: week.today,
    status,
    days,
    filtered: filterCount > 0,
    filterCount,
    filterLabels,
    summary: summarize(personal, group, conflictPairs(conflicts)),
    customized: isCustomized(personal),
    onGroupChange: selectGroup,
    onParcours: setPickerAnchor,
    onCustomize: (anchor) => setPersonalSheet({ anchor: anchor ?? null }),
    onReset: resetPersonal,
    onFilters: (anchor) => setFilterSheet({ anchor: anchor ?? null }),
    onClearFilters: () => setFilters(NO_FILTERS),
    onOpen: openSlot,
    onShiftWeek: shiftWeek,
    onToday: goToday,
    onStepDay: stepDay,
  };

  return (
    <>
      <TimetableMobile model={model} />
      <TimetableDesktop model={model} />

      <SessionSheet
        detail={
          detail && detailDay
            ? {
                day: detailDay,
                slot: slotSessions(detailSessions, detailDay, detail, mine),
                focus: detail.focus,
                status: detailStatus,
                anchor: detail.anchor,
              }
            : null
        }
        group={labelGroup}
        sectionName={sectionName}
        pdfUrl={source.url}
        conflicts={conflicts}
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

      <PersonalSheet
        open={personalSheet !== null}
        anchor={personalSheet?.anchor ?? null}
        path={basePath}
        sectionLabel={[programmeLabel, sectionLabel].filter(Boolean).join(", ")}
        sessions={sessions}
        groups={groups}
        mainGroup={group}
        catalogue={catalogue}
        onMainGroupChange={selectGroup}
        onClose={() => setPersonalSheet(null)}
      />

      <FilterSheet
        open={filterSheet !== null}
        anchor={filterSheet?.anchor ?? null}
        filters={active}
        modules={moduleNames}
        groups={filterGroups}
        count={visible.length}
        onChange={setFilters}
        onClose={() => setFilterSheet(null)}
      />
    </>
  );
}

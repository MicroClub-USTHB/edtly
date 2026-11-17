"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect, useState } from "react";
import {
  CalendarSheet,
  type CalendarIntent,
} from "@/components/calendar/calendar-sheet";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { ChangesSheet } from "@/components/overrides/changes-sheet";
import { EditSheet } from "@/components/overrides/edit-sheet";
import type { ScopeContext } from "@/components/overrides/scope-options";
import {
  ScopeSheet,
  type ScopeRequest,
} from "@/components/overrides/scope-sheet";
import type { MoveRequest } from "@/components/overrides/timetable-dnd";
import { PersonalSheet } from "@/components/personal/personal-sheet";
import type { SheetAnchor } from "@/components/ui/sheet";
import { usePathname } from "@/i18n/navigation";
import { eventText } from "@/lib/calendar/event";
import { googleEventUrl } from "@/lib/calendar/links";
import { termEnd } from "@/lib/calendar/term";
import { encodeFeed, feedLocale, feedOverrides } from "@/lib/calendar/token";
import { addDays, isoDate, minutesNow, todayIndex } from "@/lib/dates";
import {
  formatLongDate,
  formatShortDate,
  formatWeekRange,
  parseIsoDate,
} from "@/lib/format";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { usePersonalSummary } from "@/lib/hooks/use-personal-summary";
import { useOverrideActions } from "@/lib/hooks/use-override-actions";
import { usePersonalTimetable } from "@/lib/hooks/use-personal-timetable";
import { useResetPersonal } from "@/lib/hooks/use-reset-personal";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { useWeek } from "@/lib/hooks/use-week";
import { cachePages } from "@/lib/pwa/cache-pages";
import { site } from "@/lib/site";
import { trackSessions, useChangedSessions } from "@/lib/stores/changes-store";
import { saveFilters, useFilters } from "@/lib/stores/filters-store";
import { replaceUrl, useSearchParam } from "@/lib/stores/location-store";
import { useOverrides } from "@/lib/stores/overrides-store";
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
  groupFromSlug,
  groupSlug,
  localized,
  parcoursPath,
  parcoursUrl,
  sectionPath,
  TP_PARAM,
} from "@/lib/timetable/paths";
import {
  applyOverrides,
  isCancelled,
  originalOf,
  originKey,
  previewMove,
  slotOf,
  stateOf,
  type SessionState,
} from "@/lib/timetable/overrides";
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
  groupsOfType,
  overlapping,
  resolveTpGroup,
  sessionKey,
  slotSessions,
  slotStatuses,
  type Matcher,
  type Slot,
} from "@/lib/timetable/schedule";
import {
  DAYS,
  type OverrideScope,
  type CatalogueProgramme,
  type Parcours,
  type ProgrammeInfo,
  type Section,
  type Session,
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
type CalendarRequest = SheetRequest & { intent: CalendarIntent };

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
  const root = useTranslations();
  const changesT = useTranslations("Overrides");
  const locale = useLocale();
  const labels = useSessionLabels();
  const changeLabels = useChangeLabels();
  const router = useTransitionRouter();
  const saved = useSavedParcours();
  const changed = useChangedSessions();
  const pathname = usePathname();
  const summarize = usePersonalSummary();
  const selectedDay = useSelectedDay();
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useWeek();
  const shiftedWeek = useWeek(weekOffset);
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<SheetAnchor | null>(null);
  const [personalSheet, setPersonalSheet] = useState<SheetRequest | null>(null);
  const [filterSheet, setFilterSheet] = useState<SheetRequest | null>(null);
  const [calendarSheet, setCalendarSheet] = useState<CalendarRequest | null>(
    null,
  );
  const [changesSheet, setChangesSheet] = useState<SheetRequest | null>(null);
  const [pending, setPending] = useState<MoveRequest | null>(null);
  const [scopeRequest, setScopeRequest] = useState<ScopeRequest | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);

  const { system, level, speciality, source } = programme;
  const { id: sectionId, groups, sessions } = section;
  const base = { system, level, speciality: speciality.id, section: sectionId };
  const basePath = sectionPath(base);
  const filters = useFilters(basePath);
  const setFilters = (next: Filters) => saveFilters(basePath, next);
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
  const tdGroups = groupsOfType(section, "td");
  const groupChoices = tdGroups.length > 0 ? tdGroups : groups;
  const tpGroups = groupsOfType(section, "tp");
  const urlTp = groupFromSlug(tpGroups, useSearchParam(TP_PARAM));
  const chosenTp = urlTp ?? savedHere?.tpGroup ?? null;
  const tpGroup = resolveTpGroup(tpGroups, chosenTp, group);
  const parcours: Parcours = { ...base, group, tpGroup };

  const { mode, personal, entries, mySessions } = usePersonalTimetable(
    basePath,
    sessions,
    group,
    tpGroup,
  );
  const overrides = useOverrides(basePath);
  const actions = useOverrideActions(basePath, () =>
    setCalendarSheet({ anchor: null, intent: "update" }),
  );
  const until = termEnd(programme.academicYear, programme.semester);
  const viewWeek = shiftedWeek.dates ? isoDate(shiftedWeek.dates[0]) : null;
  const currentWeek = week.dates ? isoDate(week.dates[0]) : null;
  const resolve = (list: Session[], at: string | null) =>
    applyOverrides(list, overrides, at, until);
  const mineMode = mode === "mine";
  const officialOwn = mineMode ? mySessions : sessions;
  const resolvedOwn = resolve(officialOwn, viewWeek);
  const ownSessions = pending
    ? previewMove(resolvedOwn, originKey(pending.session), pending.target)
    : resolvedOwn;
  const ownMatcher = mineMode
    ? matcherFor(ownSessions)
    : forGroup(group, tpGroup);
  const inTerm = viewWeek !== null && (until === null || viewWeek <= until);
  const editable: Matcher = (session) =>
    inTerm && !session.change?.preview && ownMatcher(session);
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
  const todayOwn =
    weekOffset === 0 ? ownSessions : resolve(officialOwn, currentWeek);
  const status =
    week.now && week.today !== null
      ? dayStatus(
          todayOwn,
          week.today,
          mineMode ? matcherFor(todayOwn) : forGroup(group, tpGroup),
          minutesNow(week.now),
        )
      : null;
  const conflictAt = (session: Session, target: Slot & Pick<Session, "day">) =>
    overlapping(
      ownSessions,
      ownMatcher,
      target,
      (other) => originKey(other) === originKey(session),
    );
  const known = new Map(
    [...sessions, ...mySessions].map((item) => [sessionKey(item), item]),
  );
  const changeEntries = overrides
    .flatMap((override) => {
      const official = known.get(override.key);
      return official ? [{ override, session: official }] : [];
    })
    .sort(
      (a, b) =>
        b.override.week.localeCompare(a.override.week) ||
        a.session.module.localeCompare(b.session.module),
    );
  const calendarOverrides = feedOverrides(
    overrides,
    new Set(mySessions.map(sessionKey)),
  );
  const extrasLoading = personal.extras.some(
    (extra) => entries.get(sectionPath(extra))?.status !== "ready",
  );
  const mineEmpty = mineMode && mySessions.length === 0 && !extrasLoading;

  const sectionName = programme.sectionCount > 1 ? section.name : "";
  const sectionLabel = sectionName && t("sectionLabel", { name: sectionName });
  const groupNumber = group?.match(/^G(\d+)$/)?.[1];
  const splitGroups = group !== null && tpGroup !== null && tpGroup !== group;
  const groupsText = splitGroups
    ? t("groupsLabel", { td: group, tp: tpGroup })
    : group;
  const groupLabel = splitGroups
    ? groupsText
    : groupNumber
      ? t("groupLabel", { name: groupNumber })
      : group;
  const mineLabel = labelGroup === group ? groupsText : labelGroup;
  const filterLabels = [
    ...active.types.map((type) => types(type)),
    ...DAYS.filter((day) => active.days.includes(day)).map((day) => short(day)),
    ...active.groups,
    ...active.modules,
  ];
  const daysKey = days.join(",");
  const programmeSection = [programmeLabel, sectionLabel]
    .filter(Boolean)
    .join(" · ");
  const feedToken = encodeFeed({
    locale: feedLocale(locale),
    section: base,
    group,
    tpGroup,
    personal,
    overrides: calendarOverrides,
  });
  const pageUrl = site.url + localized(locale, parcoursUrl(parcours));
  const scopeContext: ScopeContext = {
    current: weekOffset === 0,
    range: shiftedWeek.dates
      ? formatWeekRange(shiftedWeek.dates[0], shiftedWeek.dates[5], locale)
      : { start: "", end: "" },
    from: shiftedWeek.dates ? formatShortDate(shiftedWeek.dates[0], locale) : "",
    until: until
      ? changesT("until", { date: formatLongDate(parseIsoDate(until), locale) })
      : changesT("untilEnd"),
  };

  const classUrl = (session: Session) => {
    const change = session.change;
    if (isCancelled(session) || change?.preview || !week.now) return null;
    const index = DAYS.indexOf(session.day);
    const once = change?.scope === "week";
    let date = (once ? shiftedWeek : week).dates?.[index];
    if (!date) return null;
    const today = new Date(
      week.now.getFullYear(),
      week.now.getMonth(),
      week.now.getDate(),
    );
    if (!once && date < today) date = addDays(date, 7);
    if (change?.scope === "series" && change.week) {
      const first = addDays(parseIsoDate(change.week), index);
      if (date < first) date = first;
    }
    return googleEventUrl(
      eventText(
        session,
        root,
        { sectionName, pageUrl, pdfUrl: source.url },
        change?.original,
      ),
      {
        date,
        start: session.start,
        end: session.end,
        until: once ? null : until,
      },
    );
  };

  const saveChange = (
    session: Session,
    scope: OverrideScope,
    state: SessionState,
    message: string,
  ) => {
    if (viewWeek) actions.save(session, viewWeek, scope, state, message);
  };

  const closeScope = () => {
    setPending(null);
    setScopeRequest(null);
  };

  const scopeSheet: ScopeRequest | null = pending
    ? { kind: "move", ...pending }
    : scopeRequest;

  const chooseScope = (scope: OverrideScope) => {
    const request = scopeSheet;
    closeScope();
    if (!request) return;
    const every = scope === "series";
    if (request.kind === "move") {
      saveChange(
        request.session,
        scope,
        stateOf(request.target),
        changesT(every ? "toast.movedSeries" : "toast.movedWeek", {
          target: changeLabels.target(request.target),
        }),
      );
    } else if (request.kind === "cancel") {
      saveChange(
        request.session,
        scope,
        stateOf(slotOf(request.session), true),
        changesT(every ? "toast.cancelledSeries" : "toast.cancelledWeek"),
      );
    } else {
      saveChange(
        request.session,
        scope,
        stateOf(originalOf(request.session)),
        changesT("toast.restored"),
      );
    }
  };

  const restoreSession = (session: Session) => {
    setDetail(null);
    if (session.change?.scope === "series") {
      setScopeRequest({ kind: "restore", session, anchor: null });
      return;
    }
    saveChange(
      session,
      "week",
      stateOf(originalOf(session)),
      changesT("toast.restored"),
    );
  };

  const pendingConflict = pending
    ? labels.conflict(
        conflicts.get(sessionKey({ ...pending.session, ...pending.target })),
      )
    : undefined;

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

  const ownsSaved = !saved || savedHere !== null;

  const showParcours = (next: Parcours) =>
    replaceUrl(localized(locale, parcoursUrl(next)));

  const choose = (next: Parcours) => {
    if (ownsSaved) saveParcours(next);
    showParcours(next);
  };

  const selectGroup = (next: string) =>
    choose({ ...base, group: next, tpGroup: chosenTp });

  const selectTpGroup = (next: string) =>
    choose({ ...base, group, tpGroup: next });

  const submitParcours = (next: Parcours) => {
    setPickerAnchor(null);
    saveParcours(next);
    if (sectionPath(next) !== basePath) {
      router.push(localized(locale, parcoursUrl(next)));
    } else {
      showParcours(next);
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
    ? mergeSessions(ownSessions, resolve(sessions, viewWeek))
    : ownSessions;
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
    groups: groupChoices,
    group,
    tpGroups,
    tpGroup,
    labelGroup,
    mineLabel,
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
    summary: summarize(personal, groupsText, conflictPairs(conflicts)),
    customized: isCustomized(personal),
    onGroupChange: selectGroup,
    onTpGroupChange: selectTpGroup,
    onParcours: setPickerAnchor,
    onCustomize: (anchor) => setPersonalSheet({ anchor: anchor ?? null }),
    onReset: resetPersonal,
    onFilters: (anchor) => setFilterSheet({ anchor: anchor ?? null }),
    onCalendar: (anchor) =>
      setCalendarSheet({ anchor: anchor ?? null, intent: "add" }),
    onChanges: (anchor) => setChangesSheet({ anchor: anchor ?? null }),
    changeCount: changeEntries.length,
    editable,
    dndEnabled: inTerm && pending === null,
    conflictAt,
    onMove: setPending,
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
        classUrl={classUrl}
        editable={editable}
        onEdit={(session) => {
          setDetail(null);
          setEditing(session);
        }}
        onCancelClass={(session) => {
          setDetail(null);
          setScopeRequest({ kind: "cancel", session, anchor: null });
        }}
        onRestore={restoreSession}
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
        groups={groupChoices}
        mainGroup={group}
        tpGroups={tpGroups}
        tpGroup={tpGroup}
        catalogue={catalogue}
        onMainGroupChange={selectGroup}
        onTpGroupChange={selectTpGroup}
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

      <CalendarSheet
        open={calendarSheet !== null}
        anchor={calendarSheet?.anchor ?? null}
        intent={calendarSheet?.intent ?? "add"}
        path={basePath}
        token={feedToken}
        label={programmeSection}
        summary={summarize(personal, groupsText)}
        count={extrasLoading ? null : mySessions.length}
        changes={calendarOverrides.length}
        onClose={() => setCalendarSheet(null)}
      />

      <ScopeSheet
        request={scopeSheet}
        context={scopeContext}
        conflict={pendingConflict}
        onChoose={chooseScope}
        onClose={closeScope}
      />

      <EditSheet
        session={editing}
        context={scopeContext}
        conflictFor={(session, slot) => conflictAt(session, slot)}
        onSave={(session, scope, state) => {
          setEditing(null);
          saveChange(
            session,
            scope,
            state,
            changesT(
              scope === "series" ? "toast.editedSeries" : "toast.editedWeek",
            ),
          );
        }}
        onClose={() => setEditing(null)}
      />

      <ChangesSheet
        open={changesSheet !== null}
        anchor={changesSheet?.anchor ?? null}
        entries={changeEntries}
        onRemove={actions.remove}
        onRestoreAll={() => {
          setChangesSheet(null);
          actions.restoreAll();
        }}
        onClose={() => setChangesSheet(null)}
      />
    </>
  );
}

import { useTranslations } from "next-intl";
import { notify } from "@/lib/notify";
import { readOverrides, updateOverrides } from "@/lib/stores/overrides-store";
import {
  originalOf,
  originKey,
  withOverride,
  withoutOverride,
  type Override,
  type SessionState,
} from "@/lib/timetable/overrides";
import type { OverrideScope, Session } from "@/lib/timetable/types";

export function useOverrideActions(path: string, onCalendar: () => void) {
  const t = useTranslations("Overrides");

  const commit = (
    update: (current: Override[]) => Override[],
    message: string,
  ) => {
    const previous = readOverrides(path);
    updateOverrides(path, update);
    void notify(
      "success",
      message,
      { label: t("updateCalendar"), onClick: onCalendar },
      { label: t("undo"), onClick: () => updateOverrides(path, () => previous) },
    );
  };

  const save = (
    session: Session,
    week: string,
    scope: OverrideScope,
    state: SessionState,
    message: string,
  ) =>
    commit(
      (current) =>
        withOverride(
          current,
          { key: originKey(session), scope, week, state },
          originalOf(session),
        ),
      message,
    );

  const remove = (override: Override) =>
    commit((current) => withoutOverride(current, override), t("toast.restored"));

  const restoreAll = () => commit(() => [], t("toast.restoredAll"));

  return { save, remove, restoreAll };
}

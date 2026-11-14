"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import { formatShortDate, parseIsoDate } from "@/lib/format";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  sameState,
  slotOf,
  stateOf,
  type Override,
} from "@/lib/timetable/overrides";
import type { Session } from "@/lib/timetable/types";

export type ChangeEntry = { override: Override; session: Session };

type ChangesSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  entries: ChangeEntry[];
  onRemove: (override: Override) => void;
  onRestoreAll: () => void;
  onClose: () => void;
};

export function ChangesSheet({
  open,
  anchor,
  entries,
  onRemove,
  onRestoreAll,
  onClose,
}: ChangesSheetProps) {
  const t = useTranslations("Overrides");
  const close = useTranslations("Session");
  const locale = useLocale();
  const labels = useSessionLabels();
  const changes = useChangeLabels();
  const date = (iso: string) => formatShortDate(parseIsoDate(iso), locale);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t("changesTitle")}
      closeLabel={close("close")}
      anchor={anchor}
      heading={<h2 className="text-heading">{t("changesTitle")}</h2>}
    >
      {entries.length === 0 ? (
        <p className="text-sm leading-5.25 text-foreground-secondary">
          {t("changesEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {entries.map(({ override, session }) => {
            const official = slotOf(session);
            const restoring = sameState(override.state, stateOf(official));
            const scope = restoring
              ? t("officialFrom", { date: date(override.week) })
              : override.scope === "week"
                ? t("scopeWeek", { date: date(override.week) })
                : t("scopeSeries", { date: date(override.week) });
            return (
              <li
                key={`${override.key}|${override.scope}|${override.week}`}
                className="flex items-center gap-3 border-b border-divider py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-label wrap-anywhere">
                    {`${session.module} · ${labels.type(session)}`}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-1.5 text-note text-foreground-secondary">
                    {override.state.cancelled ? (
                      `${t("cancelled")} · ${changes.slot(official)}`
                    ) : (
                      <>
                        <span>{changes.slot(official, true)}</span>
                        {!restoring && (
                          <>
                            <ArrowRight
                              size={12}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                            <span>{changes.slot(override.state, true)}</span>
                          </>
                        )}
                      </>
                    )}
                  </span>
                  <span className="text-meta text-foreground-muted">{scope}</span>
                </div>

                <button
                  type="button"
                  aria-label={t("remove", { module: session.module })}
                  onClick={() => onRemove(override)}
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground-secondary transition-colors duration-120 ease-out hover:bg-muted active:bg-muted-hover motion-reduce:transition-none"
                >
                  <RotateCcw size={17} strokeWidth={1.6} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-meta text-foreground-muted">{t("officialHint")}</p>

      {entries.length > 0 && (
        <Button variant="outline" onClick={onRestoreAll}>
          {t("restoreAll")}
        </Button>
      )}
    </Sheet>
  );
}

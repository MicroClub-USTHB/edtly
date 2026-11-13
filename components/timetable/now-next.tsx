"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useDuration } from "@/lib/hooks/use-duration";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { sessionKey, type DayStatus } from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { NowRow } from "./now-row";

type NowNextProps = {
  status: DayStatus;
  todayIndex: number;
  group: string | null;
  layout?: "stack" | "row";
  className?: string;
  onOpen: (
    dayIndex: number,
    session: Session,
    anchor: SheetAnchor,
    focus: string,
  ) => void;
};

export function NowNext({
  status,
  todayIndex,
  group,
  layout = "stack",
  className,
  onOpen,
}: NowNextProps) {
  const t = useTranslations("Now");
  const days = useTranslations("Days.long");
  const duration = useDuration();
  const labels = useSessionLabels();

  const open =
    (session: Session, dayIndex = todayIndex) =>
    (anchor: DOMRect) =>
      onOpen(dayIndex, session, anchor, sessionKey(session));

  const rows = (() => {
    if (status.kind === "now") {
      const [first] = status.current;
      return [
        <NowRow
          key="now"
          live
          label={`${t("now")} · ${t("until", { time: status.endsAt })}`}
          aside={t("remaining", { duration: duration(status.remaining) })}
          title={status.current.map(({ module }) => module).join(" + ")}
          meta={labels.meta(first, group)}
          progress={status.progress}
          onOpen={open(first)}
        />,
        status.next ? (
          <NowRow
            key="next"
            label={`${t("next")} · ${status.next.start}`}
            aside={t("in", { duration: duration(status.nextIn) })}
            title={status.next.module}
            meta={labels.meta(status.next, group)}
            onOpen={open(status.next)}
          />
        ) : (
          <NowRow key="last" label={t("next")} title={t("last")} />
        ),
      ];
    }

    if (status.kind === "free") {
      return [
        <NowRow
          key="free"
          label={
            status.started
              ? t("freeUntil", { time: status.next.start })
              : `${t("first")} · ${status.next.start}`
          }
          aside={t("in", { duration: duration(status.nextIn) })}
          title={status.next.module}
          meta={labels.meta(status.next, group)}
          onOpen={open(status.next)}
        />,
      ];
    }

    const next = status.next;
    return [
      <NowRow
        key="done"
        label={t("done")}
        title={
          next
            ? t("doneNext", {
                day: days(DAYS[next.dayIndex]).toLowerCase(),
                time: next.session.start,
                module: next.session.module,
              })
            : t("doneNone")
        }
        onOpen={next ? open(next.session, next.dayIndex) : undefined}
      />,
    ];
  })();

  return (
    <section
      aria-label={t("region")}
      className={cn(
        "flex flex-col divide-y divide-background overflow-hidden rounded-session bg-muted",
        layout === "row" && "lg:flex-row lg:divide-x lg:divide-y-0",
        className,
      )}
    >
      {rows}
    </section>
  );
}

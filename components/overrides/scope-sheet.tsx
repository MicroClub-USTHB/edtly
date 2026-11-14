"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConflictNote } from "@/components/timetable/conflict-note";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { originalOf, slotOf } from "@/lib/timetable/overrides";
import type {
  OverrideScope,
  Session,
  SessionSlot,
} from "@/lib/timetable/types";
import { ScopeOptions, type ScopeContext } from "./scope-options";

export type ScopeRequest =
  | {
      kind: "move";
      session: Session;
      target: SessionSlot;
      anchor: SheetAnchor | null;
    }
  | { kind: "cancel" | "restore"; session: Session; anchor: SheetAnchor | null };

type ScopeSheetProps = {
  request: ScopeRequest | null;
  context: ScopeContext;
  conflict?: string;
  onChoose: (scope: OverrideScope) => void;
  onClose: () => void;
};

export function ScopeSheet({
  request,
  context,
  conflict,
  onChoose,
  onClose,
}: ScopeSheetProps) {
  const t = useTranslations("Overrides");
  const session = useTranslations("Session");
  const labels = useSessionLabels();
  const changes = useChangeLabels();

  const from = request ? slotOf(request.session) : null;
  const to = !request
    ? null
    : request.kind === "move"
      ? request.target
      : request.kind === "restore"
        ? originalOf(request.session)
        : null;
  const title = request
    ? t(`${request.kind}Title`, { module: request.session.module })
    : "";

  return (
    <Sheet
      open={request !== null}
      onClose={onClose}
      label={title}
      closeLabel={session("close")}
      anchor={request?.anchor}
      heading={
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-overline text-foreground-muted uppercase">
            {request && labels.type(request.session)}
          </span>
          <h2 className="text-heading wrap-anywhere">{title}</h2>
        </span>
      }
    >
      {from && (
        <div className="flex flex-col gap-2.5 rounded-session bg-muted px-4.5 py-3.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label">
            <span
              className={
                to ? "text-foreground-muted line-through decoration-1" : undefined
              }
            >
              {changes.slot(from, true)}
            </span>
            {to && (
              <>
                <ArrowRight
                  size={15}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-foreground-muted"
                />
                <span>{changes.slot(to, true)}</span>
              </>
            )}
          </div>
          {conflict && <ConflictNote text={conflict} />}
        </div>
      )}

      <ScopeOptions context={context} autoFocus onChoose={onChoose} />

      <p className="pb-1 text-meta text-foreground-muted">
        {t("officialHint")}
      </p>
    </Sheet>
  );
}

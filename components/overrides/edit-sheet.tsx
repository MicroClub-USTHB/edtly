"use client";

import { useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { originKey, type SessionState } from "@/lib/timetable/overrides";
import type {
  OverrideScope,
  Session,
  SessionSlot,
} from "@/lib/timetable/types";
import { EditForm } from "./edit-form";
import type { ScopeContext } from "./scope-options";

type EditSheetProps = {
  session: Session | null;
  context: ScopeContext;
  conflictFor: (session: Session, slot: SessionSlot) => Session | null;
  onSave: (session: Session, scope: OverrideScope, state: SessionState) => void;
  onClose: () => void;
};

export function EditSheet({
  session,
  context,
  conflictFor,
  onSave,
  onClose,
}: EditSheetProps) {
  const t = useTranslations("Overrides");
  const close = useTranslations("Session");
  const title = session ? t("editTitle", { module: session.module }) : "";

  return (
    <Sheet
      open={session !== null}
      onClose={onClose}
      label={title}
      closeLabel={close("close")}
      heading={<h2 className="text-heading wrap-anywhere">{title}</h2>}
    >
      {session && (
        <EditForm
          key={originKey(session)}
          session={session}
          context={context}
          conflictFor={conflictFor}
          onSave={(scope, state) => onSave(session, scope, state)}
        />
      )}
    </Sheet>
  );
}

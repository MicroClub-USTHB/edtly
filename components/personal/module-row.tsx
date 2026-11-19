"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import {
  groupsOfKind,
  type GroupKind,
  type ModuleInfo,
} from "@/lib/timetable/personal";
import { cn } from "@/lib/utils";
import { GroupChips } from "./group-chips";

type ModuleRowProps = {
  module: ModuleInfo;
  included: boolean;
  groups: Record<GroupKind, string | null>;
  onIncludedChange: (included: boolean) => void;
  onGroupChange: (kind: GroupKind, group: string) => void;
};

const KINDS: GroupKind[] = ["td", "tp"];

export function ModuleRow({
  module,
  included,
  groups,
  onIncludedChange,
  onGroupChange,
}: ModuleRowProps) {
  const t = useTranslations("Personal");
  const types = useTranslations("SessionTypes");
  const kinds = KINDS.filter((kind) => groupsOfKind(module, kind).length > 1);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-b border-divider py-3 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-label wrap-anywhere",
            !included && "text-foreground-muted",
          )}
        >
          {module.name}
        </span>
        <span className="text-meta text-foreground-muted">
          {included
            ? module.types.map((type) => types(type)).join(" · ")
            : t("hidden")}
        </span>
      </div>

      {included && kinds.length > 0 && (
        <div className="col-span-2 row-start-2 flex flex-col gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          {kinds.map((kind) => (
            <div key={kind} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-6 shrink-0 text-meta font-medium text-foreground-secondary"
              >
                {types(kind)}
              </span>
              <GroupChips
                dense
                label={t(kind === "tp" ? "moduleTpGroup" : "moduleTdGroup", {
                  module: module.name,
                })}
                groups={groupsOfKind(module, kind)}
                value={groups[kind]}
                onChange={(group) => onGroupChange(kind, group)}
              />
            </div>
          ))}
        </div>
      )}

      <Switch
        checked={included}
        onCheckedChange={onIncludedChange}
        aria-label={t("follow", { module: module.name })}
        className="col-start-2 row-start-1 lg:col-start-3"
      />
    </li>
  );
}

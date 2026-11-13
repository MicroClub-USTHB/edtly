"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import type { ModuleInfo } from "@/lib/timetable/personal";
import { cn } from "@/lib/utils";
import { GroupChips } from "./group-chips";

type ModuleRowProps = {
  module: ModuleInfo;
  included: boolean;
  group: string | null;
  onIncludedChange: (included: boolean) => void;
  onGroupChange: (group: string) => void;
};

export function ModuleRow({
  module,
  included,
  group,
  onIncludedChange,
  onGroupChange,
}: ModuleRowProps) {
  const t = useTranslations("Personal");
  const types = useTranslations("SessionTypes");

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

      {included && module.groups.length > 1 && (
        <div className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <GroupChips
            dense
            label={t("moduleGroup", { module: module.name })}
            groups={module.groups}
            value={group}
            onChange={onGroupChange}
          />
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

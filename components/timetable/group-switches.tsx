"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { GroupSwitch } from "./group-switch";

type GroupSwitchesProps = {
  id: string;
  groups: string[];
  group: string | null;
  tpGroups: string[];
  tpGroup: string | null;
  onGroupChange: (group: string) => void;
  onTpGroupChange: (group: string) => void;
  size?: "md" | "sm";
};

export function GroupSwitches({
  id,
  groups,
  group,
  tpGroups,
  tpGroup,
  onGroupChange,
  onTpGroupChange,
  size = "md",
}: GroupSwitchesProps) {
  const t = useTranslations("Timetable");
  const split = tpGroups.length > 1;

  if (!split) {
    return (
      <GroupSwitch
        id={id}
        label={t("group")}
        groups={groups}
        value={group}
        onChange={onGroupChange}
        size={size}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        size === "md" ? "flex-col" : "flex-wrap items-center gap-x-4",
      )}
    >
      <GroupSwitch
        id={`${id}-td`}
        label={t("tdGroup")}
        tag={t("tdTag")}
        groups={groups}
        value={group}
        onChange={onGroupChange}
        size={size}
      />
      <GroupSwitch
        id={`${id}-tp`}
        label={t("tpGroup")}
        tag={t("tpTag")}
        groups={tpGroups}
        value={tpGroup}
        onChange={onTpGroupChange}
        size={size}
      />
    </div>
  );
}

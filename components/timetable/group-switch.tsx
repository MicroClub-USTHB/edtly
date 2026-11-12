"use client";

import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/segmented-control";

type GroupSwitchProps = {
  id: string;
  groups: string[];
  value: string | null;
  onChange: (group: string) => void;
  size?: "md" | "sm";
};

export function GroupSwitch({
  id,
  groups,
  value,
  onChange,
  size = "md",
}: GroupSwitchProps) {
  const t = useTranslations("Timetable");
  if (groups.length < 2) return null;

  return (
    <SegmentedControl
      id={id}
      label={t("group")}
      options={groups.map((group) => ({ value: group, label: group }))}
      value={value}
      onChange={onChange}
      size={size}
    />
  );
}

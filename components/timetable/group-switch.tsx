"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

type GroupSwitchProps = {
  id: string;
  label: string;
  tag?: string;
  groups: string[];
  value: string | null;
  onChange: (group: string) => void;
  size?: "md" | "sm";
};

export function GroupSwitch({
  id,
  label,
  tag,
  groups,
  value,
  onChange,
  size = "md",
}: GroupSwitchProps) {
  if (groups.length < 2) return null;

  const control = (
    <SegmentedControl
      id={id}
      label={label}
      options={groups.map((group) => ({ value: group, label: group }))}
      value={value}
      onChange={onChange}
      size={size}
      className={tag && size === "md" ? "flex-1" : undefined}
    />
  );
  if (!tag) return control;

  return (
    <div className={cn("flex items-center gap-2", size === "md" && "w-full")}>
      <span
        aria-hidden="true"
        className="w-6 shrink-0 text-meta font-medium text-foreground-secondary"
      >
        {tag}
      </span>
      {control}
    </div>
  );
}

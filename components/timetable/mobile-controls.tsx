"use client";

import { ModeSwitch } from "@/components/personal/mode-switch";
import { PersonalSummary } from "@/components/personal/personal-summary";
import type { SheetAnchor } from "@/components/ui/sheet";
import type { TimetableMode } from "@/lib/stores/mode-store";
import { GroupSwitch } from "./group-switch";

type MobileControlsProps = {
  mode: TimetableMode;
  groups: string[];
  group: string | null;
  summary: string;
  onGroupChange: (group: string) => void;
  onCustomize: (anchor: SheetAnchor) => void;
};

export function MobileControls({
  mode,
  groups,
  group,
  summary,
  onGroupChange,
  onCustomize,
}: MobileControlsProps) {
  return (
    <div data-view-panel="day week" className="flex-col gap-2 px-gutter pt-3.5">
      <ModeSwitch id="mode-mobile" />

      {mode === "mine" ? (
        <PersonalSummary summary={summary} onCustomize={onCustomize} />
      ) : (
        <GroupSwitch
          id="group-mobile"
          groups={groups}
          value={group}
          onChange={onGroupChange}
        />
      )}
    </div>
  );
}

"use client";

import { ModeSwitch } from "@/components/personal/mode-switch";
import { PersonalSummary } from "@/components/personal/personal-summary";
import type { SheetAnchor } from "@/components/ui/sheet";
import type { TimetableMode } from "@/lib/stores/mode-store";
import { GroupSwitches } from "./group-switches";

type MobileControlsProps = {
  mode: TimetableMode;
  groups: string[];
  group: string | null;
  tpGroups: string[];
  tpGroup: string | null;
  summary: string;
  onGroupChange: (group: string) => void;
  onTpGroupChange: (group: string) => void;
  onCustomize: (anchor: SheetAnchor) => void;
};

export function MobileControls({
  mode,
  groups,
  group,
  tpGroups,
  tpGroup,
  summary,
  onGroupChange,
  onTpGroupChange,
  onCustomize,
}: MobileControlsProps) {
  return (
    <div data-view-panel="day week" className="flex-col gap-2 px-gutter pt-3.5">
      <ModeSwitch id="mode-mobile" />

      {mode === "mine" ? (
        <PersonalSummary summary={summary} onCustomize={onCustomize} />
      ) : (
        <GroupSwitches
          id="group-mobile"
          groups={groups}
          group={group}
          tpGroups={tpGroups}
          tpGroup={tpGroup}
          onGroupChange={onGroupChange}
          onTpGroupChange={onTpGroupChange}
        />
      )}
    </div>
  );
}

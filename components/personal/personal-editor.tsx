"use client";

import { ChevronLeft, Plus, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { useResetPersonal } from "@/lib/hooks/use-reset-personal";
import { setMode } from "@/lib/stores/mode-store";
import { updatePersonal, usePersonal } from "@/lib/stores/personal-store";
import { useRemoteSections } from "@/lib/stores/section-store";
import { sectionPath } from "@/lib/timetable/paths";
import {
  defaultGroupFor,
  extraKey,
  groupFor,
  isCustomized,
  modulesOf,
  type Extra,
  type ModuleInfo,
  type Personal,
} from "@/lib/timetable/personal";
import type { CatalogueProgramme, Session } from "@/lib/timetable/types";
import { ExtraPicker } from "./extra-picker";
import { ExtraRow } from "./extra-row";
import { GroupChips } from "./group-chips";
import { ModuleRow } from "./module-row";

type PersonalEditorProps = {
  path: string;
  sectionLabel: string;
  sessions: Session[];
  groups: string[];
  mainGroup: string | null;
  tpGroups: string[];
  tpGroup: string | null;
  catalogue: CatalogueProgramme[];
  onMainGroupChange: (group: string) => void;
  onTpGroupChange: (group: string) => void;
};

export function PersonalEditor({
  path,
  sectionLabel,
  sessions,
  groups,
  mainGroup,
  tpGroups,
  tpGroup,
  catalogue,
  onMainGroupChange,
  onTpGroupChange,
}: PersonalEditorProps) {
  const t = useTranslations("Personal");
  const [adding, setAdding] = useState(false);
  const personal = usePersonal(path);
  const reset = useResetPersonal(path);
  const entries = useRemoteSections([
    ...new Set(personal.extras.map(sectionPath)),
  ]);
  const modules = modulesOf(sessions);

  const update = (change: (current: Personal) => Personal) => {
    updatePersonal(path, change);
    setMode("mine");
  };

  const setIncluded = (module: string, included: boolean) =>
    update((current) => ({
      ...current,
      hidden: included
        ? current.hidden.filter((name) => name !== module)
        : [...current.hidden, module],
    }));

  const setModuleGroup = (module: ModuleInfo, group: string) =>
    update((current) => ({
      ...current,
      groups: Object.fromEntries([
        ...Object.entries(current.groups).filter(
          ([name]) => name !== module.name,
        ),
        ...(group === defaultGroupFor(module, mainGroup, tpGroup)
          ? []
          : [[module.name, group]]),
      ]),
    }));

  const replaceExtras = (change: (extras: Extra[]) => Extra[]) =>
    update((current) => ({ ...current, extras: change(current.extras) }));

  if (adding) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => setAdding(false)}
          className="-ml-2 flex h-11 items-center gap-1 self-start rounded-full pr-3 pl-1.5 text-label text-foreground-secondary transition-colors duration-120 ease-out hover:bg-muted active:bg-muted-hover motion-reduce:transition-none"
        >
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          {t("back")}
        </button>

        <h3 className="text-heading">{t("addTitle")}</h3>
        <p className="text-note text-foreground-secondary">{t("extrasHint")}</p>

        <ExtraPicker
          catalogue={catalogue}
          onAdd={(extra) => {
            replaceExtras((extras) => [
              ...extras.filter((item) => extraKey(item) !== extraKey(extra)),
              extra,
            ]);
            setAdding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.length > 1 && (
        <SettingsSection level="h3" label={t("mainGroup")}>
          <GroupChips
            dense
            label={t("mainGroup")}
            groups={groups}
            value={mainGroup}
            onChange={onMainGroupChange}
          />
        </SettingsSection>
      )}

      {tpGroups.length > 1 && (
        <SettingsSection level="h3" label={t("tpGroup")}>
          <GroupChips
            dense
            label={t("tpGroup")}
            groups={tpGroups}
            value={tpGroup}
            onChange={onTpGroupChange}
          />
        </SettingsSection>
      )}

      <SettingsSection
        level="h3"
        label={t("modules", { section: sectionLabel })}
        dense
      >
        <ul className="flex flex-col">
          {modules.map((module) => (
            <ModuleRow
              key={module.name}
              module={module}
              included={!personal.hidden.includes(module.name)}
              group={groupFor(module, personal, mainGroup, tpGroup)}
              onIncludedChange={(included) =>
                setIncluded(module.name, included)
              }
              onGroupChange={(group) => setModuleGroup(module, group)}
            />
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection level="h3" label={t("extras")} dense>
        {personal.extras.length === 0 && (
          <p className="pb-1 text-note text-foreground-muted">
            {t("extrasHint")}
          </p>
        )}

        <ul className="flex flex-col">
          {personal.extras.map((extra) => (
            <ExtraRow
              key={extraKey(extra)}
              extra={extra}
              entry={entries.get(sectionPath(extra))}
              onGroupChange={(group) =>
                replaceExtras((extras) =>
                  extras.map((item) =>
                    extraKey(item) === extraKey(extra) ? { ...item, group } : item,
                  ),
                )
              }
              onRemove={() =>
                replaceExtras((extras) =>
                  extras.filter((item) => extraKey(item) !== extraKey(extra)),
                )
              }
            />
          ))}
        </ul>

        <Button variant="outline" className="mt-2" onClick={() => setAdding(true)}>
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          {t("add")}
        </Button>
      </SettingsSection>

      <Button
        variant="ghost"
        aria-disabled={!isCustomized(personal)}
        className="aria-disabled:pointer-events-none aria-disabled:text-foreground-muted"
        onClick={reset}
      >
        <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
        {t("reset")}
      </Button>
    </div>
  );
}

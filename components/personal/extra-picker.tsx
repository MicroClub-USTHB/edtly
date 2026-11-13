"use client";

import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PickerRow, type PickerOption } from "@/components/academic/picker-row";
import { Banner } from "@/components/ui/banner";
import { BannerAction } from "@/components/ui/banner-action";
import { Button } from "@/components/ui/button";
import { loadSection, useRemoteSections } from "@/lib/stores/section-store";
import { levelLabel, sectionPath } from "@/lib/timetable/paths";
import { modulesOf, type Extra } from "@/lib/timetable/personal";
import {
  EMPTY_SELECTION,
  levelsOf,
  pick,
  sectionsOf,
  specialitiesOf,
  systemsOf,
  type PickerField,
  type Selection,
} from "@/lib/timetable/picker";
import type { CatalogueProgramme } from "@/lib/timetable/types";

type ExtraPickerProps = {
  catalogue: CatalogueProgramme[];
  onAdd: (extra: Extra) => void;
};

type Row = {
  key: string;
  label: string;
  options: PickerOption[];
  value: string | null;
  onPick: (value: string) => void;
};

export function ExtraPicker({ catalogue, onAdd }: ExtraPickerProps) {
  const t = useTranslations("Picker");
  const p = useTranslations("Personal");
  const systems = useTranslations("Systems");
  const programmes = catalogue.filter(
    (programme) =>
      programme.status === "published" && programme.sections.length > 0,
  );
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [module, setModule] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);

  const { system, level, speciality, section } = selection;
  const path =
    system && level && speciality && section
      ? sectionPath({ system, level, speciality, section })
      : null;
  const entry = useRemoteSections(path ? [path] : []).get(path ?? "");
  const modules =
    entry?.status === "ready" ? modulesOf(entry.data.section.sessions) : [];
  const info = modules.find(({ name }) => name === module);
  const groups = info?.groups ?? [];
  const chosenGroup = groups.length === 1 ? groups[0] : group;
  const complete = Boolean(info && (groups.length === 0 || chosenGroup));

  const choose = (field: PickerField, value: string) => {
    setSelection(pick(programmes, selection, field, value));
    setModule(null);
    setGroup(null);
  };

  const specialities =
    system && level ? specialitiesOf(programmes, system, level) : [];
  const sections = sectionsOf(programmes, selection);

  const rows: Row[] = [
    {
      key: "system",
      label: t("system"),
      options: systemsOf(programmes).map((value) => ({
        value,
        label: systems(value),
      })),
      value: system,
      onPick: (value) => choose("system", value),
    },
    {
      key: "level",
      label: t("level"),
      options: system
        ? levelsOf(programmes, system).map((value) => ({
            value,
            label: levelLabel(value),
          }))
        : [],
      value: level,
      onPick: (value) => choose("level", value),
    },
    {
      key: "speciality",
      label: t("speciality"),
      options:
        specialities.length > 1
          ? specialities.map(({ speciality: { id, name } }) => ({
              value: id,
              label: name,
            }))
          : [],
      value: speciality,
      onPick: (value) => choose("speciality", value),
    },
    {
      key: "section",
      label: t("section"),
      options:
        sections.length > 1
          ? sections.map(({ id, name }) => ({ value: id, label: name }))
          : [],
      value: section,
      onPick: (value) => choose("section", value),
    },
    {
      key: `module-${path}`,
      label: p("module"),
      options: modules.map(({ name }) => ({ value: name, label: name })),
      value: module,
      onPick: (value) => {
        setModule(value);
        setGroup(null);
      },
    },
    {
      key: `group-${path}-${module}`,
      label: t("group"),
      options:
        groups.length > 1
          ? groups.map((value) => ({ value, label: value }))
          : [],
      value: chosenGroup,
      onPick: setGroup,
    },
  ];

  const submit = () => {
    if (!complete || !system || !level || !speciality || !section || !module) {
      return;
    }
    onAdd({
      system,
      level,
      speciality,
      section,
      module,
      group: groups.length > 0 ? chosenGroup : null,
    });
  };

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {rows
          .filter((row) => row.options.length > 0)
          .map((row) => (
            <PickerRow
              key={row.key}
              first={row.key === "system"}
              label={row.label}
              options={row.options}
              value={row.value}
              onPick={row.onPick}
            />
          ))}
      </AnimatePresence>

      {entry?.status === "loading" && (
        <p role="status" className="pt-5 text-note text-foreground-muted">
          {p("loading")}
        </p>
      )}

      {entry?.status === "error" && path && (
        <Banner
          tone="error"
          className="mt-5"
          action={
            <BannerAction onClick={() => loadSection(path, true)}>
              {p("retry")}
            </BannerAction>
          }
        >
          {p("loadFailed")}
        </Banner>
      )}

      <Button size="lg" className="mt-6" aria-disabled={!complete} onClick={submit}>
        {p("addSubmit")}
      </Button>
    </div>
  );
}

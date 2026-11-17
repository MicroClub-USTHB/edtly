"use client";

import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { levelLabel } from "@/lib/timetable/paths";
import {
  EMPTY_SELECTION,
  groupsOf,
  levelsOf,
  pick,
  resolve,
  sectionsOf,
  selectionOf,
  specialitiesOf,
  systemsOf,
  tpGroupsOf,
  type PickerField,
  type Selection,
} from "@/lib/timetable/picker";
import type { CatalogueProgramme, Parcours } from "@/lib/timetable/types";
import { PickerRow, type PickerOption } from "./picker-row";

type ParcoursPickerProps = {
  catalogue: CatalogueProgramme[];
  initial?: Parcours | null;
  submitLabel: string;
  onSubmit: (parcours: Parcours) => void;
};

export function ParcoursPicker({
  catalogue,
  initial,
  submitLabel,
  onSubmit,
}: ParcoursPickerProps) {
  const t = useTranslations("Picker");
  const systems = useTranslations("Systems");
  const [selection, setSelection] = useState<Selection>(
    initial ? selectionOf(initial) : EMPTY_SELECTION,
  );
  const { system, level } = selection;
  const parcours = resolve(catalogue, selection);

  const specialities =
    system && level ? specialitiesOf(catalogue, system, level) : [];
  const sections = sectionsOf(catalogue, selection);
  const groups = groupsOf(catalogue, selection);
  const tpGroups = selection.group ? tpGroupsOf(catalogue, selection) : [];

  const rows: { field: PickerField; options: PickerOption[] }[] = [
    {
      field: "system",
      options: systemsOf(catalogue).map((value) => ({
        value,
        label: systems(value),
      })),
    },
    {
      field: "level",
      options: system
        ? levelsOf(catalogue, system).map((value) => ({
            value,
            label: levelLabel(value),
          }))
        : [],
    },
    {
      field: "speciality",
      options:
        specialities.length > 1
          ? specialities.map(({ speciality }) => ({
              value: speciality.id,
              label: speciality.name,
            }))
          : [],
    },
    {
      field: "section",
      options:
        sections.length > 1
          ? sections.map(({ id, name }) => ({ value: id, label: name }))
          : [],
    },
    {
      field: "group",
      options:
        groups.length > 1
          ? groups.map((value) => ({ value, label: value }))
          : [],
    },
    {
      field: "tpGroup",
      options:
        tpGroups.length > 1
          ? tpGroups.map((value) => ({ value, label: value }))
          : [],
    },
  ];

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {rows
          .filter((row) => row.options.length > 0)
          .map((row) => (
            <PickerRow
              key={row.field}
              first={row.field === "system"}
              label={t(row.field)}
              options={row.options}
              value={selection[row.field]}
              onPick={(value) =>
                setSelection(pick(catalogue, selection, row.field, value))
              }
            />
          ))}
      </AnimatePresence>

      <Button
        size="lg"
        className="mt-6"
        aria-disabled={!parcours}
        onClick={() => parcours && onSubmit(parcours)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

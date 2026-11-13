"use client";

import { useTranslations } from "next-intl";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import {
  activeFilterCount,
  NO_FILTERS,
  toggleValue,
  type Filters,
} from "@/lib/timetable/filters";
import {
  DAYS,
  SESSION_TYPES,
  type Day,
  type SessionType,
} from "@/lib/timetable/types";
import { FilterChips } from "./filter-chips";

type FilterSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  filters: Filters;
  modules: string[];
  groups: string[];
  count: number;
  onChange: (filters: Filters) => void;
  onClose: () => void;
};

export function FilterSheet({
  open,
  anchor,
  filters,
  modules,
  groups,
  count,
  onChange,
  onClose,
}: FilterSheetProps) {
  const t = useTranslations("Filters");
  const session = useTranslations("Session");
  const types = useTranslations("SessionTypes");
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t("title")}
      closeLabel={session("close")}
      anchor={anchor}
      heading={<h2 className="text-heading">{t("title")}</h2>}
    >
      <div className="flex flex-col gap-6">
        <SettingsSection level="h3" label={t("types")}>
          <FilterChips
            label={t("types")}
            options={SESSION_TYPES.map((value) => ({
              value,
              label: types(value),
            }))}
            values={filters.types}
            onToggle={(value) =>
              onChange({
                ...filters,
                types: toggleValue(filters.types, value as SessionType),
              })
            }
          />
        </SettingsSection>

        <SettingsSection level="h3" label={t("days")}>
          <FilterChips
            label={t("days")}
            options={DAYS.map((value) => ({
              value,
              label: short(value),
              ariaLabel: long(value),
            }))}
            values={filters.days}
            onToggle={(value) =>
              onChange({
                ...filters,
                days: toggleValue(filters.days, value as Day),
              })
            }
          />
        </SettingsSection>

        {groups.length > 1 && (
          <SettingsSection level="h3" label={t("groups")}>
            <FilterChips
              label={t("groups")}
              options={groups.map((value) => ({ value, label: value }))}
              values={filters.groups}
              onToggle={(value) =>
                onChange({
                  ...filters,
                  groups: toggleValue(filters.groups, value),
                })
              }
            />
          </SettingsSection>
        )}

        <SettingsSection level="h3" label={t("modules")}>
          <FilterChips
            label={t("modules")}
            options={modules.map((value) => ({ value, label: value }))}
            values={filters.modules}
            onToggle={(value) =>
              onChange({
                ...filters,
                modules: toggleValue(filters.modules, value),
              })
            }
          />
        </SettingsSection>

        <div className="flex gap-2 pt-1">
          <Button
            variant="ghost"
            aria-disabled={activeFilterCount(filters) === 0}
            className="aria-disabled:pointer-events-none aria-disabled:text-foreground-muted"
            onClick={() => onChange(NO_FILTERS)}
          >
            {t("clearAll")}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t("show", { count })}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

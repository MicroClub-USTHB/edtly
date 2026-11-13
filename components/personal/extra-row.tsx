"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSectionLabel } from "@/lib/hooks/use-section-label";
import type { RemoteEntry } from "@/lib/stores/section-store";
import { modulesOf, type Extra } from "@/lib/timetable/personal";
import { GroupChips } from "./group-chips";

type ExtraRowProps = {
  extra: Extra;
  entry: RemoteEntry | undefined;
  onGroupChange: (group: string) => void;
  onRemove: () => void;
};

export function ExtraRow({
  extra,
  entry,
  onGroupChange,
  onRemove,
}: ExtraRowProps) {
  const t = useTranslations("Personal");
  const label = useSectionLabel();
  const data = entry?.status === "ready" ? entry.data : null;
  const info = data
    ? modulesOf(data.section.sessions).find(({ name }) => name === extra.module)
    : undefined;
  const missing = entry?.status === "error" || (data !== null && !info);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-b border-divider py-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label wrap-anywhere">{extra.module}</span>
        <span
          className={
            missing ? "text-meta text-error" : "text-meta text-foreground-muted"
          }
        >
          {missing
            ? t("unavailable")
            : data
              ? label({
                  level: data.programme.level,
                  specialityName: data.programme.speciality.name,
                  sectionName: data.section.name,
                  sectionCount: data.programme.sectionCount,
                })
              : " "}
        </span>
      </div>

      {info && info.groups.length > 1 && (
        <div className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <GroupChips
            dense
            label={t("moduleGroup", { module: extra.module })}
            groups={info.groups}
            value={extra.group}
            onChange={onGroupChange}
          />
        </div>
      )}

      <button
        type="button"
        aria-label={t("remove", { module: extra.module })}
        onClick={onRemove}
        className="col-start-2 row-start-1 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground-secondary transition-colors duration-120 ease-out hover:bg-muted active:bg-muted-hover motion-reduce:transition-none lg:col-start-3"
      >
        <X size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </li>
  );
}

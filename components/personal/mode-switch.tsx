"use client";

import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMounted } from "@/lib/hooks/use-mounted";
import { setMode, useMode, type TimetableMode } from "@/lib/stores/mode-store";

type ModeSwitchProps = {
  id: string;
  size?: "md" | "compact";
};

export function ModeSwitch({ id, size = "md" }: ModeSwitchProps) {
  const t = useTranslations("Personal");
  const mode = useMode();
  const mounted = useMounted();

  return (
    <SegmentedControl<TimetableMode>
      id={id}
      label={t("view")}
      size={size}
      value={mounted ? mode : null}
      onChange={setMode}
      options={[
        { value: "mine", label: t("mine") },
        { value: "full", label: t("full") },
      ]}
    />
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  label: string;
  dense?: boolean;
  children: ReactNode;
};

export function SettingsSection({
  label,
  dense = false,
  children,
}: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col", dense ? "gap-1" : "gap-2")}>
      <h2 className="text-overline text-foreground-muted uppercase">{label}</h2>
      {children}
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  label: string;
  level?: "h2" | "h3";
  dense?: boolean;
  children: ReactNode;
};

export function SettingsSection({
  label,
  level: Heading = "h2",
  dense = false,
  children,
}: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col", dense ? "gap-1" : "gap-2")}>
      <Heading className="text-overline text-foreground-muted uppercase">
        {label}
      </Heading>
      {children}
    </section>
  );
}

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  const t = useTranslations("Legal");

  return (
    <p className={cn("text-meta text-foreground-muted", className)}>
      {t("disclaimer")}
    </p>
  );
}

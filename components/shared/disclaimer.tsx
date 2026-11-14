import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MadeBy } from "./made-by";

export function Disclaimer({ className }: { className?: string }) {
  const t = useTranslations("Legal");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-meta text-foreground-muted",
        className,
      )}
    >
      <p>{t("disclaimer")}</p>
      <p>
        <MadeBy />
      </p>
    </div>
  );
}

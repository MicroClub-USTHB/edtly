import { cn } from "@/lib/utils";

type WeekLegendProps = {
  mine: string | null;
  cours: string;
  others: string | null;
  className?: string;
};

const DOT = "size-2.5 shrink-0 rounded-full";

export function WeekLegend({ mine, cours, others, className }: WeekLegendProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center text-foreground-secondary",
        className,
      )}
    >
      {mine && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn(DOT, "bg-primary")} />
          {mine}
        </li>
      )}

      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cn(DOT, "bg-cours")} />
        {cours}
      </li>

      {others && (
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(DOT, "border border-border-strong bg-muted")}
          />
          {others}
        </li>
      )}
    </ul>
  );
}

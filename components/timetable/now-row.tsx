import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NowRowProps = {
  label: string;
  aside?: string;
  title: ReactNode;
  meta?: string;
  live?: boolean;
  progress?: number;
  onOpen?: (anchor: DOMRect) => void;
};

export function NowRow({
  label,
  aside,
  title,
  meta,
  live = false,
  progress,
  onOpen,
}: NowRowProps) {
  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-overline text-foreground-muted uppercase">
          {live && (
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-primary"
            />
          )}
          <span className="truncate">{label}</span>
        </span>
        {aside && (
          <span className="shrink-0 text-meta text-foreground-secondary tabular-nums">
            {aside}
          </span>
        )}
      </span>

      <span className="text-label wrap-anywhere">{title}</span>
      {meta && (
        <span className="text-meta text-foreground-secondary">{meta}</span>
      )}

      {progress !== undefined && (
        <span
          aria-hidden="true"
          className="mt-1.5 h-1 overflow-hidden rounded-full bg-border"
        >
          <span
            className="block h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{
              transform: `scaleX(${Math.min(1, Math.max(0, progress))})`,
            }}
          />
        </span>
      )}
    </>
  );

  const classes = "flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 text-left";

  return onOpen ? (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        classes,
        "transition-colors duration-120 ease-out hover:bg-muted-hover active:bg-muted-hover motion-reduce:transition-none",
      )}
    >
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}

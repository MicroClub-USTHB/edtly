import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type ConflictNoteProps = {
  text: string;
  className?: string;
};

export function ConflictNote({ text, className }: ConflictNoteProps) {
  return (
    <span
      className={cn(
        "flex items-start gap-1.5 text-meta text-warning",
        className,
      )}
    >
      <TriangleAlert
        size={12}
        strokeWidth={1.75}
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      />
      <span className="min-w-0 wrap-anywhere">{text}</span>
    </span>
  );
}

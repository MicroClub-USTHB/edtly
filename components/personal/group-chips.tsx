import { Chip } from "@/components/ui/chip";

type GroupChipsProps = {
  label: string;
  dense?: boolean;
  groups: string[];
  value: string | null;
  onChange: (group: string) => void;
};

export function GroupChips({
  label,
  dense = false,
  groups,
  value,
  onChange,
}: GroupChipsProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {groups.map((group) => (
        <Chip
          key={group}
          selected={group === value}
          onClick={() => onChange(group)}
          className={
            dense ? "lg:min-h-9 lg:min-w-11 lg:px-3 lg:text-sm" : undefined
          }
        >
          {group}
        </Chip>
      ))}
    </div>
  );
}

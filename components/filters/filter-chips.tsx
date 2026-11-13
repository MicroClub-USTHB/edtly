import { Chip } from "@/components/ui/chip";

export type FilterOption = { value: string; label: string; ariaLabel?: string };

type FilterChipsProps = {
  label: string;
  options: FilterOption[];
  values: string[];
  onToggle: (value: string) => void;
};

export function FilterChips({
  label,
  options,
  values,
  onToggle,
}: FilterChipsProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={values.includes(option.value)}
          aria-label={option.ariaLabel}
          onClick={() => onToggle(option.value)}
          className="lg:min-h-9 lg:min-w-11 lg:px-3 lg:text-sm"
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

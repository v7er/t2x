import { cn } from "@/lib/cn";
import type { Energy } from "@/lib/types";

const LEVELS: { value: Energy; label: string }[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "Quiet" },
  { value: 3, label: "Steady" },
  { value: 4, label: "Strong" },
  { value: 5, label: "Peak" },
];

export function EnergyPicker({
  value,
  onChange,
  labels,
}: {
  value: Energy;
  onChange: (v: Energy) => void;
  labels?: string[];
}) {
  const levels = LEVELS.map((level, i) => ({ ...level, label: labels?.[i] ?? level.label }));
  return (
    <div>
      <div className="flex items-end gap-2">
        {levels.map((level) => {
          const active = value === level.value;
          const height = 18 + level.value * 8;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              aria-label={level.label}
              aria-pressed={active}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-end gap-2 rounded-md px-1 py-1 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
                active ? "text-fg" : "text-subtle hover:text-muted",
              )}
            >
              <span
                className={cn(
                  "w-full max-w-8 rounded-sm transition-colors duration-150",
                  active ? "bg-accent" : "bg-fg/15",
                )}
                style={{ height }}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm text-muted">{levels[value - 1]?.label}</p>
    </div>
  );
}

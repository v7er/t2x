import { QUALITY_COLOR } from "@/lib/spans";
import type { RoundQuality } from "@/lib/types";
import { cn } from "@/lib/cn";

const OPTIONS: { id: RoundQuality; label: string }[] = [
  { id: "bad", label: "Bad" },
  { id: "medium", label: "Medium" },
  { id: "good", label: "Good" },
];

export function QualityPick({
  value,
  onChange,
}: {
  value: RoundQuality;
  onChange: (value: RoundQuality) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium",
              on ? "text-[#1a1408]" : "bg-surface-2 text-muted",
            )}
            style={on ? { background: QUALITY_COLOR[option.id] } : undefined}
          >
            <span className="size-2 rounded-full" style={{ background: on ? "#1a1408" : QUALITY_COLOR[option.id] }} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

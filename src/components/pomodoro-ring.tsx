import { kindLabel, formatMs } from "@/lib/time";
import type { TimerKind } from "@/lib/types";

const SIZE = 280;
const CX = 140;
const CY = 140;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function PomodoroRing({
  remainingMs,
  durationMs,
  kind,
}: {
  remainingMs: number;
  durationMs: number;
  kind: TimerKind;
}) {
  const progress = durationMs <= 0 ? 0 : 1 - remainingMs / durationMs;
  const r = 108;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * circ;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const isRest = kind !== "focus";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden="true">
        {ticks.map((i) => {
          const major = i % 5 === 0;
          const from = polar(CX, CY, major ? 126 : 128, i * 6);
          const to = polar(CX, CY, 134, i * 6);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeWidth={major ? 1.4 : 0.8}
              className={major ? "text-fg/35" : "text-fg/12"}
            />
          );
        })}
        <circle
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-fg/8"
        />
        <circle
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          className="transition-[stroke-dasharray] duration-300 ease-out"
          opacity={isRest ? 0.7 : 1}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-subtle">
          {kindLabel(kind)}
        </p>
        <p className="mt-1 font-sans text-[3.15rem] font-medium leading-none tracking-tight text-fg tabular-nums">
          {formatMs(remainingMs)}
        </p>
      </div>
    </div>
  );
}

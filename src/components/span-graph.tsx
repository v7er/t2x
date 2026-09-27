import { useState, type CSSProperties } from "react";
import { AvatarPicker } from "./avatar-picker";
import { TONE_VAR, activeSpans, activeThreads } from "@/lib/spans";
import { avatarSrc } from "@/lib/avatar";
import { todayMinutes, todayRounds, weekMinutes, weekRounds } from "@/lib/selectors";
import { useT2xStore } from "@/lib/store";
import { formatMinutes } from "@/lib/time";
import { cn } from "@/lib/cn";

export function SpanGraph({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (spanId: string) => void;
}) {
  const name = useT2xStore((s) => s.settings.displayName);
  const portrait = useT2xStore((s) => s.settings.avatarUrl);
  const focused = useT2xStore(todayMinutes);
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const [hovered, setHovered] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const first = name.split(" ")[0] || "Me";
  const label = first.length > 10 ? `${first.slice(0, 9)}…` : first;
  const liveId = hovered ?? selectedId ?? spans[0]?.id ?? null;
  const selected = spans.find((s) => s.id === selectedId) ?? spans[0];
  const threads = activeThreads(selected);
  const orbit = spans.length > 4 ? 33 : 32;

  const nodes = spans.map((span, i) => {
    const rad = ((-90 + (i * 360) / Math.max(spans.length, 1)) * Math.PI) / 180;
    return {
      span,
      x: 50 + orbit * Math.cos(rad),
      y: 50 + orbit * Math.sin(rad),
      ox: `${Math.cos(rad) * 10}px`,
      oy: `${Math.sin(rad) * 10}px`,
    };
  });

  return (
    <div>
      <div className="t2x-graph">
        <svg viewBox="0 0 100 100" className="t2x-graph-svg" aria-hidden="true">
          <circle className="t2x-orbit" cx="50" cy="50" r={orbit} />
          {nodes.map(({ span, x, y }) => {
            const live = liveId === span.id;
            return (
              <line
                key={span.id}
                className={cn("t2x-spoke", live && "is-live")}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke={TONE_VAR[span.tone]}
              />
            );
          })}
        </svg>

        <button
          type="button"
          className="t2x-me"
          aria-label="Change center image"
          onClick={() => setAvatarOpen(true)}
        >
          <span className="t2x-me-ring" />
          <span className="t2x-me-clip">
            <img src={avatarSrc(portrait)} alt="" className="t2x-me-photo" />
            <span className="t2x-me-veil">
              <span className="t2x-me-kicker">Me</span>
              <span className="t2x-me-name">{label}</span>
              <span className="t2x-me-time">{formatMinutes(focused)}</span>
            </span>
          </span>
        </button>

        {nodes.map(({ span, x, y, ox, oy }) => (
          <SpanOrb
            key={span.id}
            spanId={span.id}
            x={x}
            y={y}
            ox={ox}
            oy={oy}
            north={y < 48}
            selected={selectedId === span.id}
            live={liveId === span.id}
            dimmed={Boolean(liveId) && liveId !== span.id}
            onSelect={onSelect}
            onHover={setHovered}
          />
        ))}
      </div>

      {selected ? (
        <div className="mt-5">
          <p className="mb-3 text-center text-xs uppercase tracking-widest text-subtle">{selected.name}</p>
          {threads.length === 0 ? (
            <p className="text-center text-sm text-muted">No threads yet. Add them on Spans.</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {threads.map((thread) => (
                <ThreadChip key={thread.id} spanId={selected.id} threadId={thread.id} label={thread.name} />
              ))}
            </div>
          )}
        </div>
      ) : null}
      <AvatarPicker opened={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </div>
  );
}

function SpanOrb({
  spanId,
  x,
  y,
  ox,
  oy,
  north,
  selected,
  live,
  dimmed,
  onSelect,
  onHover,
}: {
  spanId: string;
  x: number;
  y: number;
  ox: string;
  oy: string;
  north: boolean;
  selected: boolean;
  live: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const span = useT2xStore((s) => s.spans.find((item) => item.id === spanId));
  const minutes = useT2xStore((s) => todayMinutes(s, spanId));
  const rounds = useT2xStore((s) => todayRounds(s, spanId));
  if (!span) return null;
  const amount = span.mode === "count" ? `${rounds} rnd` : formatMinutes(minutes);

  return (
    <button
      type="button"
      className={cn("t2x-span", north && "is-north", live && "is-live", dimmed && "is-dim")}
      style={
        {
          left: `${x}%`,
          top: `${y}%`,
          "--tone": TONE_VAR[span.tone],
          "--ox": ox,
          "--oy": oy,
        } as CSSProperties
      }
      aria-pressed={selected}
      onClick={() => onSelect(span.id)}
      onMouseEnter={() => onHover(span.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(span.id)}
      onBlur={() => onHover(null)}
    >
      <span className="t2x-span-core" />
      <span className="t2x-span-copy">
        <span className="t2x-span-name">{span.name}</span>
        <span className="t2x-span-mins">{amount}</span>
      </span>
    </button>
  );
}

function ThreadChip({ spanId, threadId, label }: { spanId: string; threadId: string; label: string }) {
  const counting = useT2xStore((s) => s.spans.find((item) => item.id === spanId)?.mode === "count");
  const minutes = useT2xStore((s) => weekMinutes(s, spanId, threadId));
  const rounds = useT2xStore((s) => weekRounds(s, spanId, threadId));
  const timer = useT2xStore((s) => s.timer);
  const setTimerSpan = useT2xStore((s) => s.setTimerSpan);
  const setTimerThread = useT2xStore((s) => s.setTimerThread);
  const active = timer.spanId === spanId && timer.threadId === threadId;

  return (
    <button
      type="button"
      onClick={() => {
        setTimerSpan(spanId);
        setTimerThread(threadId);
      }}
      className={cn(
        "min-h-11 min-w-36 rounded-md px-4 py-2.5 text-left text-sm transition-[transform,box-shadow,background-color,color] duration-150 ease-out active:scale-[0.96]",
        active ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-border hover:shadow-border-hover",
      )}
    >
      <span className="block font-medium leading-snug">{label}</span>
      <span className={cn("mt-0.5 block text-xs tabular-nums", active ? "text-accent-fg/70" : "text-subtle")}>
        {counting ? `${rounds} this week` : `${formatMinutes(minutes)} this week`}
      </span>
    </button>
  );
}

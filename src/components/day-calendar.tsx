import { useMemo, useState } from "react";
import { Tooltip } from "@mantine/core";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { QUALITY_COLOR } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import { roundMarks, roundsOf, sessionsOnDay, todayKey } from "@/lib/time";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FULL_BAR = 4;

export function DayCalendar() {
  const sessions = useT2xStore((s) => s.sessions);
  const checkIns = useT2xStore((s) => s.checkIns);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const today = todayKey();
  const thisMonth = startOfMonth(new Date()).getTime();

  const { lead, days } = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const leadCount = (getDay(start) + 6) % 7;
    return { lead: leadCount, days: eachDayOfInterval({ start, end }) };
  }, [cursor]);

  return (
    <section className="rounded-xl bg-surface p-3 shadow-border">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-fg">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-fg/6 hover:text-fg"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={cursor.getTime() >= thisMonth}
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-fg/6 hover:text-fg disabled:opacity-30"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label, i) => (
          <p key={`${label}-${i}`} className="text-center text-[0.6rem] font-medium tracking-widest text-subtle">
            {label}
          </p>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {days.map((day) => {
          const key = todayKey(day);
          const daySessions = sessionsOnDay(sessions, key);
          const marks = roundMarks(daySessions);
          const rounds = roundsOf(daySessions);
          const note = checkIns.find((c) => c.date === key)?.message.trim() ?? "";
          const isToday = key === today;
          const fill = marks.length === 0 ? 0 : Math.min(100, (marks.length / FULL_BAR) * 100);
          return (
            <div
              key={key}
              className={cn(
                "flex items-stretch gap-1 rounded-sm bg-bg/50 px-1 py-1",
                isToday ? "shadow-[inset_0_0_0_1.5px_var(--color-accent)]" : "shadow-border",
              )}
            >
              <div className="flex h-10 w-2 shrink-0 flex-col justify-end overflow-hidden rounded-full bg-fg/10">
                {fill > 0 ? (
                  <div className="flex w-full flex-col-reverse" style={{ height: `${fill}%` }}>
                    {marks.map((mark, index) => (
                      <div key={`${key}-${index}`} className="min-h-px w-full flex-1" style={{ background: QUALITY_COLOR[mark] }} />
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-center justify-between gap-0.5">
                  <span className={cn("text-[11px] tabular-nums leading-none", isToday ? "text-accent" : "text-muted")}>
                    {format(day, "d")}
                  </span>
                  {note ? <NoteMark message={note} /> : null}
                </div>
                <span className="text-[10px] tabular-nums leading-none text-subtle">
                  {rounds > 0 ? rounds : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 flex items-center gap-3 text-[0.65rem] text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-3 w-1.5 flex-col overflow-hidden rounded-full">
            <span className="w-full flex-1" style={{ background: QUALITY_COLOR.good }} />
            <span className="w-full flex-1" style={{ background: QUALITY_COLOR.medium }} />
            <span className="w-full flex-1" style={{ background: QUALITY_COLOR.bad }} />
          </span>
          Bad · medium · good
        </span>
        <span className="inline-flex items-center gap-1">
          <Bookmark className="size-2.5 text-accent" strokeWidth={1.75} />
          Note
        </span>
      </p>
    </section>
  );
}

function NoteMark({ message }: { message: string }) {
  return (
    <Tooltip
      label={<span className="block max-w-[220px] whitespace-pre-wrap text-left leading-snug">{message}</span>}
      withArrow
      multiline
      maw={240}
      position="top"
      events={{ hover: true, focus: true, touch: true }}
    >
      <button
        type="button"
        aria-label={`Check-in: ${message}`}
        className="grid size-4 place-items-center text-accent"
      >
        <Bookmark className="size-2.5" strokeWidth={1.75} fill="currentColor" />
      </button>
    </Tooltip>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TONE_VAR, activeSpans, activeThreads } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import {
  computeStreak,
  formatMinutes,
  formatShortDay,
  lastNDays,
  minutesOf,
  roundsOf,
  sessionsOnDay,
  todayKey,
  weekBounds,
} from "@/lib/time";

export const Route = createFileRoute("/insights")({ component: Insights });

function Insights() {
  const sessions = useT2xStore((s) => s.sessions);
  const checkIns = useT2xStore((s) => s.checkIns);
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const days = lastNDays(7);
  const { start, end } = weekBounds();

  const chart = days.map((d) => ({
    label: formatShortDay(d),
    minutes: Math.round(minutesOf(sessionsOnDay(sessions, todayKey(d)))),
  }));

  const weekSessions = sessions.filter(
    (s) => s.startedAt >= start.getTime() && s.startedAt <= end.getTime(),
  );

  const bySpan = spans
    .map((span) => ({
      span,
      minutes: minutesOf(weekSessions.filter((s) => s.spanId === span.id)),
      threads: activeThreads(span)
        .map((thread) => ({
          thread,
          minutes: minutesOf(weekSessions.filter((s) => s.threadId === thread.id)),
        }))
        .filter((row) => row.minutes > 0),
    }))
    .filter((row) => row.minutes > 0);

  const totalWeek = minutesOf(weekSessions);
  const streak = computeStreak(sessions, checkIns);
  const focusCount = roundsOf(weekSessions);
  const timed = weekSessions.filter((s) => s.source === "focus");
  const avg = timed.length > 0 ? minutesOf(timed) / timed.length : 0;
  const checkDays = new Set(
    checkIns
      .filter((c) => {
        const t = new Date(`${c.date}T12:00:00`).getTime();
        return t >= start.getTime() && t <= end.getTime();
      })
      .map((c) => c.date),
  ).size;

  return (
    <div className="page-enter flex flex-col gap-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-fg">Insights</h1>
        <p className="mt-1 text-sm text-muted">The week as it was actually spent.</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Streak" value={`${streak}`} unit={streak === 1 ? "day" : "days"} />
        <Stat label="This week" value={formatMinutes(totalWeek)} unit="focused" />
        <Stat label="Rounds" value={`${focusCount}`} unit="this week" />
        <Stat label="Check-ins" value={`${checkDays}/7`} unit="days"} />
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-border">
        <h2 className="mb-4 text-sm font-medium text-fg">Last seven days</h2>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barCategoryGap="28%">
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-subtle)", fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgb(238 240 235 / 0.04)" }}
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-fg)",
                  fontSize: 13,
                }}
                formatter={(value) => [formatMinutes(Number(value ?? 0)), "Focused"]}
              />
              <Bar dataKey="minutes" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg">Where time went</h2>
        {bySpan.length === 0 ? (
          <p className="rounded-lg bg-surface px-4 py-5 text-sm text-muted shadow-border">
            Complete a round or log time to see the split.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex h-3 overflow-hidden rounded-full bg-fg/8">
              {bySpan.map((row) => (
                <div
                  key={row.span.id}
                  style={{
                    width: `${(row.minutes / Math.max(totalWeek, 1)) * 100}%`,
                    background: TONE_VAR[row.span.tone],
                  }}
                />
              ))}
            </div>
            <ul className="flex flex-col gap-3">
              {bySpan.map((row) => (
                <li key={row.span.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-fg">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: TONE_VAR[row.span.tone] }}
                      />
                      {row.span.name}
                    </span>
                    <span className="tabular-nums text-muted">{formatMinutes(row.minutes)}</span>
                  </div>
                  {row.threads.length > 0 ? (
                    <ul className="mt-1.5 flex flex-col gap-1 pl-4">
                      {row.threads.map((item) => (
                        <li
                          key={item.thread.id}
                          className="flex items-center justify-between text-sm text-muted"
                        >
                          <span>{item.thread.name}</span>
                          <span className="tabular-nums">{formatMinutes(item.minutes)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {avg > 0 ? (
        <p className="text-sm text-subtle">
          Average round this week:{" "}
          <span className="tabular-nums text-muted">{formatMinutes(avg)}</span>
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-4 shadow-border">
      <p className="text-xs uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none text-fg tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{unit}</p>
    </div>
  );
}

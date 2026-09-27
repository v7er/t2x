import { useEffect, useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { notifications } from "@mantine/notifications";
import { ArrowRight, Plus } from "lucide-react";
import { CountRoundModal } from "@/components/count-round";
import { DayCalendar } from "@/components/day-calendar";
import { LogTimeModal } from "@/components/log-time-modal";
import { SpanGraph } from "@/components/span-graph";
import { installHint } from "@/lib/native";
import { todayCheckIn, todayMinutes, todayRoundCount } from "@/lib/selectors";
import { activeSpans, spanById, threadById } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import { computeStreak, formatDayLabel, formatMinutes, greeting, sessionAmount, sessionsOnDay, todayKey } from "@/lib/time";

export const Route = createFileRoute("/")({ component: Today });

function Today() {
  const navigate = useNavigate();
  const name = useT2xStore((s) => s.settings.displayName);
  const timer = useT2xStore((s) => s.timer);
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const sessions = useT2xStore((s) => s.sessions);
  const checkIns = useT2xStore((s) => s.checkIns);
  const focused = useT2xStore(todayMinutes);
  const rounds = useT2xStore(todayRoundCount);
  const startTimer = useT2xStore((s) => s.startTimer);
  const setTimerSpan = useT2xStore((s) => s.setTimerSpan);
  const promptRoundFeedback = useT2xStore((s) => s.promptRoundFeedback);
  const [logOpen, setLogOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(timer.spanId ?? spans[0]?.id ?? null);
  const streak = computeStreak(sessions, checkIns);
  const first = name.split(" ")[0] || name;
  const todayRounds = sessionsOnDay(sessions, todayKey()).slice().reverse();
  const selected = spanById(spans, selectedId);
  const countMode = selected?.mode === "count" && timer.status !== "running";

  return (
    <div className="page-enter flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">{formatDayLabel()}</p>
        <h1 className="mt-1 font-display text-4xl font-medium leading-tight tracking-tight text-fg">
          {greeting()}, {first}.
        </h1>
        <p className="mt-2 text-sm text-muted">
          <span className="tabular-nums text-fg">{rounds}</span>
          {rounds === 1 ? " round" : " rounds"}
          <span className="mx-2 text-subtle">·</span>
          <span className="tabular-nums">{formatMinutes(focused)}</span> today
          <span className="mx-2 text-subtle">·</span>
          <span className="tabular-nums text-fg">{streak}</span>
          {streak === 1 ? " day" : " days"} in motion
        </p>
        <HomeInstallHint />
      </header>

      <DailyCheckIn />

      <DayCalendar />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="md"
            className="flex-1"
            rightSection={<ArrowRight className="size-4" strokeWidth={1.75} />}
            onClick={() => {
              if (countMode) {
                setCountOpen(true);
                return;
              }
              void navigate({ to: "/focus" });
              if (timer.status !== "running") startTimer();
            }}
          >
            {timer.status === "running" ? "Return to round" : countMode ? "Log rounds" : "Start a round"}
          </Button>
          {countMode ? null : (
            <Button
              variant="default"
              size="md"
              leftSection={<Plus className="size-4" strokeWidth={1.75} />}
              onClick={() => setLogOpen(true)}
            >
              Log time
            </Button>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-fg">Today’s rounds</h2>
          {todayRounds.length === 0 ? (
            <p className="rounded-lg bg-surface px-4 py-5 text-sm text-muted shadow-border">
              A day can hold many rounds. Timed spans use the clock. Count spans just take a number.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayRounds.map((s) => {
                const span = spanById(spans, s.spanId);
                const thread = threadById(spans, s.threadId);
                return (
                  <li key={s.id} className="rounded-lg bg-surface px-4 py-3 shadow-border">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-fg">
                        {span?.name ?? "Span"}
                        {thread ? <span className="text-muted"> · {thread.name}</span> : null}
                      </p>
                      <p className="text-sm tabular-nums text-muted">{sessionAmount(s)}</p>
                    </div>
                    {s.concern ? (
                      <p className="mt-1 font-display text-sm italic text-muted">{s.concern}</p>
                    ) : s.source === "focus" ? (
                      <button
                        type="button"
                        onClick={() => promptRoundFeedback(s.id)}
                        className="mt-1 text-xs text-subtle underline-offset-4 hover:text-fg hover:underline"
                      >
                        Add concern
                      </button>
                    ) : s.note ? (
                      <p className="mt-1 text-sm text-muted">{s.note}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SpanGraph
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setTimerSpan(id);
          }}
        />
      </section>

      <LogTimeModal
        opened={logOpen}
        onClose={() => setLogOpen(false)}
        defaultSpanId={selectedId ?? timer.spanId}
      />
      <CountRoundModal opened={countOpen} onClose={() => setCountOpen(false)} spanId={selectedId} />
    </div>
  );
}

function DailyCheckIn() {
  const existing = useT2xStore(todayCheckIn);
  const saveCheckIn = useT2xStore((s) => s.saveCheckIn);
  const [message, setMessage] = useState(existing?.message ?? "");
  const [seen, setSeen] = useState(existing?.id ?? "new");
  const stamp = existing?.id ?? "new";
  if (seen !== stamp) {
    setSeen(stamp);
    setMessage(existing?.message ?? "");
  }

  function save() {
    const text = message.trim();
    if (!text) return;
    saveCheckIn({ message: text });
    notifications.show({
      title: existing ? "Note updated" : "Checked in",
      message: "It sits on today’s calendar.",
      color: "sage",
    });
  }

  return (
    <section id="check-in" className="flex scroll-mt-20 items-stretch gap-2">
      <Textarea
        className="min-w-0 flex-1"
        size="sm"
        placeholder="One message for the day"
        minRows={2}
        maxRows={3}
        autosize
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
      />
      <div className="flex w-28 shrink-0 flex-col gap-1.5">
        <Button size="sm" className="flex-1" onClick={save} disabled={!message.trim()}>
          Save
        </Button>
        <Button size="sm" className="flex-1" variant="default" component={Link} to="/insights">
          Insights
        </Button>
      </div>
    </section>
  );
}

function HomeInstallHint() {
  const [hint, setHint] = useState<"ios" | "mac" | null>(null);
  useEffect(() => {
    const next = installHint();
    if (next === "ios" || next === "mac") setHint(next);
  }, []);
  if (!hint) return null;
  return (
    <p className="mt-3 text-sm text-muted">
      {hint === "ios"
        ? "Add to Home Screen: Safari Share → Add to Home Screen. Then T2x opens as an app, offline."
        : "Keep T2x on this Mac: Safari File → Add to Dock, or use the T2x app."}
    </p>
  );
}

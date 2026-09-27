import { useEffect, useState } from "react";
import { ActionIcon, Button, Select } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { CountRoundForm } from "@/components/count-round";
import { PomodoroRing } from "@/components/pomodoro-ring";
import { activeSpans, activeThreads, spanById, threadById } from "@/lib/spans";
import { getTimerRemaining, useT2xStore } from "@/lib/store";
import type { Session, Span } from "@/lib/types";
import { formatMinutes, kindLabel, sessionAmount, sessionsOnDay, todayKey } from "@/lib/time";

export const Route = createFileRoute("/focus")({ component: Focus });

function Focus() {
  const timer = useT2xStore((s) => s.timer);
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const sessions = useT2xStore((s) => s.sessions);
  const settings = useT2xStore((s) => s.settings);
  const setTimerSpan = useT2xStore((s) => s.setTimerSpan);
  const setTimerThread = useT2xStore((s) => s.setTimerThread);
  const startTimer = useT2xStore((s) => s.startTimer);
  const pauseTimer = useT2xStore((s) => s.pauseTimer);
  const resetTimer = useT2xStore((s) => s.resetTimer);
  const skipTimer = useT2xStore((s) => s.skipTimer);
  const completeEarly = useT2xStore((s) => s.completeEarly);
  const promptRoundFeedback = useT2xStore((s) => s.promptRoundFeedback);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (timer.status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.status]);

  const remaining = getTimerRemaining(timer, now);
  const span = spanById(spans, timer.spanId) ?? spans[0];
  const threads = activeThreads(span);
  const todayRounds = sessionsOnDay(sessions, todayKey());
  const running = timer.status === "running";
  const canEdit = timer.status !== "running" && timer.kind === "focus";
  const showCount = span?.mode === "count" && timer.status === "idle";

  if (showCount && span) {
    return (
      <div className="page-enter flex flex-col items-center gap-6">
        <header className="w-full text-center">
          <h1 className="font-display text-3xl font-medium tracking-tight text-fg">Round</h1>
          <p className="mt-1 text-sm text-muted">{span.name} counts rounds. Enter a number and submit.</p>
        </header>
        <div className="w-full max-w-sm">
          <Select
            label="Span"
            data={spans.map((s) => ({ value: s.id, label: s.mode === "count" ? `${s.name} · count` : s.name }))}
            value={span.id}
            onChange={(v) => v && setTimerSpan(v)}
            allowDeselect={false}
          />
        </div>
        <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-border">
          <CountRoundForm spanId={span.id} />
        </div>
        <div className="w-full">
          <RoundList spans={spans} sessions={todayRounds} promptRoundFeedback={promptRoundFeedback} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center gap-6">
      <header className="w-full text-center">
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg">Round</h1>
        <p className="mt-1 text-sm text-muted">
          A day can hold many rounds. One thread at a time.
        </p>
      </header>

      <PomodoroRing remainingMs={remaining} durationMs={timer.durationMs} kind={timer.kind} />

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Select
          label="Span"
          data={spans.map((s) => ({ value: s.id, label: s.mode === "count" ? `${s.name} · count` : s.name }))}
          value={span?.id ?? null}
          onChange={(v) => v && setTimerSpan(v)}
          disabled={!canEdit}
          allowDeselect={false}
        />
        {threads.length > 0 ? (
          <Select
            label="Thread"
            data={threads.map((t) => ({ value: t.id, label: t.name }))}
            value={timer.threadId}
            onChange={(v) => setTimerThread(v)}
            disabled={!canEdit}
            allowDeselect={false}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <ActionIcon variant="default" size={48} radius="md" aria-label="Reset" onClick={resetTimer}>
          <RotateCcw className="size-4" strokeWidth={1.75} />
        </ActionIcon>
        <Button
          size="lg"
          radius="xl"
          className="min-w-36"
          onClick={() => (running ? pauseTimer() : startTimer())}
          leftSection={
            running ? (
              <Pause className="size-4" strokeWidth={1.75} />
            ) : (
              <Play className="ml-0.5 size-4" strokeWidth={1.75} />
            )
          }
        >
          {running ? "Pause" : timer.status === "paused" ? "Resume" : "Start"}
        </Button>
        <ActionIcon variant="default" size={48} radius="md" aria-label="Skip" onClick={skipTimer}>
          <SkipForward className="size-4" strokeWidth={1.75} />
        </ActionIcon>
      </div>
      <p className="text-xs tracking-wide text-subtle">Space start · ⌘K jump</p>

      {timer.status !== "idle" && timer.kind === "focus" ? (
        <button
          type="button"
          onClick={() => completeEarly()}
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Seal early
        </button>
      ) : null}

      <p className="text-sm tabular-nums text-subtle">
        {timer.cycleCount % settings.sessionsUntilLongBreak}/{settings.sessionsUntilLongBreak} toward long rest
      </p>

      <section className="w-full">
        <RoundList spans={spans} sessions={todayRounds} promptRoundFeedback={promptRoundFeedback} />
      </section>

      {timer.lastCompleted && Date.now() - timer.lastCompleted.at < 8_000 ? (
        <p className="text-sm text-accent">
          {kindLabel(timer.lastCompleted.kind)} sealed · {formatMinutes(timer.lastCompleted.minutes)}
        </p>
      ) : null}
    </div>
  );
}

function RoundList({
  spans,
  sessions,
  promptRoundFeedback,
}: {
  spans: Span[];
  sessions: Session[];
  promptRoundFeedback: (id: string) => void;
}) {
  return (
    <>
      <h2 className="mb-3 text-sm font-medium text-fg">Today’s rounds</h2>
      {sessions.length === 0 ? (
        <p className="rounded-lg bg-surface px-4 py-5 text-sm text-muted shadow-border">
          No rounds yet. Start one and leave a concern when it closes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions
            .slice()
            .reverse()
            .map((s) => {
              const sp = spanById(spans, s.spanId);
              const th = threadById(spans, s.threadId);
              return (
                <li key={s.id} className="rounded-lg bg-surface px-4 py-3 shadow-border">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-fg">
                      {sp?.name ?? "Span"}
                      {th ? <span className="text-muted"> · {th.name}</span> : null}
                    </span>
                    <span className="text-sm tabular-nums text-muted">{sessionAmount(s)}</span>
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
                  ) : null}
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
}

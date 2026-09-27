import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@mantine/core";
import { Pause } from "lucide-react";
import { PomodoroRing } from "./pomodoro-ring";
import { LogoMark } from "./logo";
import { spanById, threadById } from "@/lib/spans";
import { getTimerRemaining, useT2xStore } from "@/lib/store";
import { kindLabel } from "@/lib/time";

export function FocusLock() {
  const timer = useT2xStore((s) => s.timer);
  const spans = useT2xStore((s) => s.spans);
  const pauseTimer = useT2xStore((s) => s.pauseTimer);
  const completeEarly = useT2xStore((s) => s.completeEarly);
  const skipTimer = useT2xStore((s) => s.skipTimer);
  const [now, setNow] = useState(Date.now());
  const pauseRef = useRef<HTMLButtonElement>(null);
  const running = timer.status === "running";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    pauseRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        pauseTimer();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [running, pauseTimer]);

  if (!running) return null;

  const remaining = getTimerRemaining(timer, now);
  const span = spanById(spans, timer.spanId);
  const thread = threadById(spans, timer.threadId);
  const toward = [span?.name, thread?.name].filter(Boolean).join(" · ");
  const rest = timer.kind !== "focus";

  return createPortal(
    <div className="t2x-lock" role="dialog" aria-modal="true" aria-labelledby="t2x-lock-title">
      <div className="t2x-lock-inner">
        <LogoMark className="text-accent" />
        <p id="t2x-lock-title" className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-subtle">
          {rest ? "Rest locked" : "Round locked"}
        </p>
        {toward ? <p className="mt-2 text-sm text-muted">{toward}</p> : null}

        <div className="mt-6 w-full">
          <PomodoroRing remainingMs={remaining} durationMs={timer.durationMs} kind={timer.kind} />
        </div>

        <Button
          ref={pauseRef}
          size="lg"
          radius="xl"
          className="mt-4 min-w-40"
          onClick={() => pauseTimer()}
          leftSection={<Pause className="size-4" strokeWidth={1.75} />}
        >
          Pause
        </Button>
        <p className="mt-3 text-xs tracking-wide text-subtle">Space or Escape to leave</p>

        {rest ? (
          <button type="button" className="t2x-lock-quiet" onClick={() => skipTimer()}>
            Skip rest
          </button>
        ) : (
          <button type="button" className="t2x-lock-quiet" onClick={() => completeEarly()}>
            Seal early
          </button>
        )}

        <p className="mt-8 font-display text-sm italic text-subtle">
          {kindLabel(timer.kind)} holds the screen until you pause.
        </p>
      </div>
    </div>,
    document.body,
  );
}

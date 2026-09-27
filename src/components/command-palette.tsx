import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Clock,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  SkipForward,
  Square,
  Sun,
  Timer,
} from "lucide-react";
import { LogTimeModal } from "./log-time-modal";
import { isDialogOpen, isTypingTarget } from "@/lib/keys";
import { activeSpans, activeThreads } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-auto shrink-0 rounded-sm bg-bg px-1.5 py-0.5 font-sans text-[0.65rem] font-medium tracking-wide text-subtle shadow-border">
      {children}
    </kbd>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  onSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettings: () => void;
}) {
  const navigate = useNavigate();
  const timer = useT2xStore((s) => s.timer);
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const startTimer = useT2xStore((s) => s.startTimer);
  const pauseTimer = useT2xStore((s) => s.pauseTimer);
  const resetTimer = useT2xStore((s) => s.resetTimer);
  const skipTimer = useT2xStore((s) => s.skipTimer);
  const completeEarly = useT2xStore((s) => s.completeEarly);
  const setTimerSpan = useT2xStore((s) => s.setTimerSpan);
  const setTimerThread = useT2xStore((s) => s.setTimerThread);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const modPressed = e.metaKey || e.ctrlKey;

      if (modPressed && key === "k") {
        if (useT2xStore.getState().timer.status === "running") {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onOpenChange(!open);
        return;
      }

      if (open) return;
      if (isTypingTarget(e.target)) return;

      if (key === "/" && !modPressed && !e.altKey) {
        if (useT2xStore.getState().timer.status === "running") return;
        e.preventDefault();
        onOpenChange(true);
        return;
      }

      if (modPressed && key === "enter") {
        e.preventDefault();
        armRound();
        return;
      }

      if (e.code === "Space" && !modPressed && !isDialogOpen()) {
        e.preventDefault();
        if (timer.status === "running") pauseTimer();
        else armRound();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, navigate, startTimer, pauseTimer, timer.status]);

  function run(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  function go(to: "/" | "/focus" | "/checkin" | "/spans" | "/insights") {
    run(() => {
      void navigate({ to });
    });
  }

  function armRound() {
    const state = useT2xStore.getState();
    void navigate({ to: "/focus" });
    if (state.timer.status === "running") return;
    const span = state.spans.find((item) => item.id === state.timer.spanId);
    if (span?.mode === "count" && state.timer.status !== "paused") return;
    startTimer();
  }

  function beginOn(spanId: string, threadId: string | null) {
    const span = spans.find((item) => item.id === spanId);
    run(() => {
      setTimerSpan(spanId);
      setTimerThread(threadId);
      void navigate({ to: "/focus" });
      if (span?.mode !== "count") startTimer();
    });
  }

  const running = timer.status === "running";

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Command menu"
        loop
        vimBindings={false}
        overlayClassName="t2x-cmdk-overlay"
        contentClassName="t2x-cmdk-content"
        className="t2x-cmdk"
      >
        <Command.Input placeholder="Start a round, jump a thread…" />
        <Command.List>
          <Command.Empty>Nothing matches.</Command.Empty>

          <Command.Group heading="Round">
            <Command.Item
              value={running ? "pause round" : "start resume round"}
              onSelect={() =>
                run(() => {
                  if (running) pauseTimer();
                  else armRound();
                })
              }
            >
              {running ? <Pause className="size-4" strokeWidth={1.75} /> : <Play className="size-4" strokeWidth={1.75} />}
              {running ? "Pause round" : timer.status === "paused" ? "Resume round" : "Start round"}
              <Kbd>Space</Kbd>
            </Command.Item>
            <Command.Item
              value="seal early finish round"
              disabled={timer.status === "idle" || timer.kind !== "focus"}
              onSelect={() => run(() => completeEarly())}
            >
              <Square className="size-4" strokeWidth={1.75} />
              Seal early
            </Command.Item>
            <Command.Item value="reset round" onSelect={() => run(() => resetTimer())}>
              <RotateCcw className="size-4" strokeWidth={1.75} />
              Reset round
            </Command.Item>
            <Command.Item value="skip rest" onSelect={() => run(() => skipTimer())}>
              <SkipForward className="size-4" strokeWidth={1.75} />
              Skip
            </Command.Item>
            <Command.Item
              value="log time"
              onSelect={() =>
                run(() => {
                  setLogOpen(true);
                })
              }
            >
              <Plus className="size-4" strokeWidth={1.75} />
              Log time
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Go">
            <Command.Item value="today home" onSelect={() => go("/")}>
              <Sun className="size-4" strokeWidth={1.75} />
              Today
            </Command.Item>
            <Command.Item value="round focus timer" onSelect={() => go("/focus")}>
              <Timer className="size-4" strokeWidth={1.75} />
              Round
              <Kbd>⌘↵</Kbd>
            </Command.Item>
            <Command.Item
              value="check-in"
              onSelect={() =>
                run(() => {
                  void navigate({ to: "/", hash: "check-in" });
                })
              }
            >
              <ClipboardCheck className="size-4" strokeWidth={1.75} />
              Check-in
            </Command.Item>
            <Command.Item value="spans threads" onSelect={() => go("/spans")}>
              <Layers className="size-4" strokeWidth={1.75} />
              Spans
            </Command.Item>
            <Command.Item value="insights pulse" onSelect={() => go("/insights")}>
              <Clock className="size-4" strokeWidth={1.75} />
              Insights
            </Command.Item>
            <Command.Item value="settings" onSelect={() => run(onSettings)}>
              <Settings className="size-4" strokeWidth={1.75} />
              Settings
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Threads">
            {spans.flatMap((span) => {
              const threads = activeThreads(span);
              if (threads.length === 0) {
                return [
                  <Command.Item
                    key={span.id}
                    value={`thread ${span.name}`}
                    onSelect={() => beginOn(span.id, null)}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: `var(--color-tone-${span.tone})` }}
                    />
                    {span.name}
                  </Command.Item>,
                ];
              }
              return threads.map((thread) => (
                <Command.Item
                  key={thread.id}
                  value={`thread ${thread.name} ${span.name}`}
                  onSelect={() => beginOn(span.id, thread.id)}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: `var(--color-tone-${span.tone})` }}
                  />
                  {thread.name}
                  <span className="text-subtle">{span.name}</span>
                </Command.Item>
              ));
            })}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
      <LogTimeModal opened={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}

import { useEffect, useRef } from "react";
import { notifications } from "@mantine/notifications";
import { playChime, unlockChime } from "@/lib/chime";
import { spanById } from "@/lib/spans";
import { getTimerRemaining, useT2xStore } from "@/lib/store";
import { formatMinutes, kindLabel } from "@/lib/time";

export function TimerWatcher() {
  const timer = useT2xStore((s) => s.timer);
  const completeTimer = useT2xStore((s) => s.completeTimer);
  const spans = useT2xStore((s) => s.spans);
  const locking = useRef(false);
  const chimedAt = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => {
      void unlockChime();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (timer.status === "running") void unlockChime();
  }, [timer.status]);

  useEffect(() => {
    if (timer.status !== "running") return;

    const tick = () => {
      if (locking.current) return;
      if (getTimerRemaining(useT2xStore.getState().timer) > 0) return;
      locking.current = true;
      completeTimer();
      locking.current = false;
    };

    tick();
    const id = window.setInterval(tick, 400);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [timer.status, timer.endsAt, completeTimer]);

  useEffect(() => {
    const done = timer.lastCompleted;
    if (!done) return;
    if (Date.now() - done.at > 2500) return;
    if (chimedAt.current === done.at) return;
    chimedAt.current = done.at;
    void playChime(done.kind === "focus" ? "focus" : "break");
    const span = spanById(spans, done.spanId);
    notifications.show({
      title: `${kindLabel(done.kind)} complete`,
      message:
        done.kind === "focus"
          ? `${formatMinutes(done.minutes)} toward ${span?.name ?? "your span"}`
          : "Ready for the next round.",
      color: "sage",
    });
  }, [timer.lastCompleted, spans]);

  useEffect(() => {
    if (timer.status !== "running") {
      document.title = "T2x";
      return;
    }
    const update = () => {
      const left = getTimerRemaining(useT2xStore.getState().timer);
      const s = Math.max(0, Math.ceil(left / 1000));
      const m = Math.floor(s / 60);
      const r = s % 60;
      document.title = `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")} · T2x`;
    };
    update();
    const id = window.setInterval(update, 500);
    return () => {
      window.clearInterval(id);
      document.title = "T2x";
    };
  }, [timer.status, timer.endsAt]);

  return null;
}

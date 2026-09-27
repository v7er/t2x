import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SPANS, activeThreads, asQuality, spanById, withDefaultThreads } from "./spans";
import type {
  CheckIn,
  LastCompleted,
  PersistedData,
  RoundQuality,
  Session,
  Settings,
  Span,
  SpanMode,
  SpanTone,
  SubSpan,
  TimerKind,
  TimerState,
} from "./types";

const FOCUS_DEFAULT = 25;
const SHORT_DEFAULT = 5;
const LONG_DEFAULT = 15;

function msFor(kind: TimerKind, settings: Settings): number {
  const minutes =
    kind === "focus"
      ? settings.focusMinutes
      : kind === "short-break"
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return minutes * 60_000;
}

function idleTimer(settings: Settings, spanId: string | null, extras?: Partial<TimerState>): TimerState {
  const durationMs = msFor("focus", settings);
  return {
    status: "idle",
    kind: "focus",
    spanId,
    threadId: extras?.threadId ?? null,
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    cycleCount: extras?.cycleCount ?? 0,
    lastCompleted: extras?.lastCompleted ?? null,
    pendingFeedbackId: extras?.pendingFeedbackId ?? null,
  };
}

function newId(): string {
  return crypto.randomUUID();
}

const defaultSettings: Settings = {
  displayName: "",
  avatarUrl: null,
  focusMinutes: FOCUS_DEFAULT,
  shortBreakMinutes: SHORT_DEFAULT,
  longBreakMinutes: LONG_DEFAULT,
  sessionsUntilLongBreak: 4,
};

const defaultTimer = idleTimer(defaultSettings, "confident", { threadId: "confident-programming" });

export interface T2xStore extends PersistedData {
  hydrateDone: boolean;
  completeOnboarding: (name: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addSpan: (input: {
    name: string;
    tagline: string;
    tone: SpanTone;
    mode: SpanMode;
    weeklyGoalMinutes: number;
    weeklyGoalRounds: number;
  }) => void;
  updateSpan: (
    id: string,
    patch: Partial<Pick<Span, "name" | "tagline" | "tone" | "mode" | "weeklyGoalMinutes" | "weeklyGoalRounds">>,
  ) => void;
  archiveSpan: (id: string) => void;
  addThread: (spanId: string, name: string) => void;
  archiveThread: (spanId: string, threadId: string) => void;
  setTimerSpan: (spanId: string) => void;
  setTimerThread: (threadId: string | null) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  completeTimer: () => LastCompleted | null;
  completeEarly: () => LastCompleted | null;
  clearLastCompleted: () => void;
  saveRoundFeedback: (sessionId: string, concern: string, quality: RoundQuality) => void;
  dismissRoundFeedback: () => void;
  promptRoundFeedback: (sessionId: string) => void;
  logTime: (spanId: string, rounds: number, quality: RoundQuality, note?: string, threadId?: string | null) => void;
  submitRounds: (input: {
    spanId: string;
    threadId: string | null;
    rounds: number;
    quality: RoundQuality;
    note?: string;
  }) => void;
  removeSession: (id: string) => void;
  saveCheckIn: (input: { message: string; date?: string }) => void;
  resetAll: () => void;
}

function nextKindAfterFocus(cycleCount: number, settings: Settings): TimerKind {
  const next = cycleCount + 1;
  if (next > 0 && next % settings.sessionsUntilLongBreak === 0) return "long-break";
  return "short-break";
}

function armKind(kind: TimerKind, state: T2xStore, extras?: Partial<TimerState>): TimerState {
  const durationMs = msFor(kind, state.settings);
  return {
    status: "idle",
    kind,
    spanId: extras?.spanId ?? state.timer.spanId,
    threadId: extras?.threadId ?? state.timer.threadId,
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    cycleCount: extras?.cycleCount ?? state.timer.cycleCount,
    lastCompleted: extras?.lastCompleted ?? state.timer.lastCompleted,
    pendingFeedbackId: extras?.pendingFeedbackId ?? state.timer.pendingFeedbackId,
  };
}

function remainingNow(timer: TimerState, now = Date.now()): number {
  if (timer.status === "running" && timer.endsAt) return Math.max(0, timer.endsAt - now);
  return timer.remainingMs;
}

function pickFirstThread(spans: Span[], spanId: string | null): string | null {
  const span = spanById(spans, spanId);
  return activeThreads(span)[0]?.id ?? null;
}

function sealFocusRound(
  state: T2xStore,
  elapsed: number,
  now: number,
  apply: (partial: Partial<T2xStore>) => void,
): LastCompleted {
  const { timer, settings } = state;
  const sessionId = newId();
  const lastCompleted: LastCompleted = {
    kind: timer.kind,
    spanId: timer.spanId,
    threadId: timer.threadId,
    sessionId,
    minutes: Math.round(elapsed / 60000),
    at: now,
  };

  if (timer.kind === "focus" && timer.spanId) {
    const session: Session = {
      id: sessionId,
      spanId: timer.spanId,
      threadId: timer.threadId,
      startedAt: now - elapsed,
      endedAt: now,
      durationMs: elapsed,
      source: "focus",
      note: "",
      concern: "",
      rounds: 1,
      quality: "good",
    };
    const cycleCount = timer.cycleCount + 1;
    const kind = nextKindAfterFocus(timer.cycleCount, settings);
    apply({
      sessions: [...state.sessions, session],
      timer: armKind(kind, { ...state, timer: { ...timer, cycleCount } }, {
        cycleCount,
        lastCompleted,
        pendingFeedbackId: sessionId,
        threadId: timer.threadId,
      }),
    });
    return lastCompleted;
  }

  apply({
    timer: armKind("focus", state, {
      lastCompleted,
      cycleCount: timer.cycleCount,
      pendingFeedbackId: state.timer.pendingFeedbackId,
    }),
  });
  return lastCompleted;
}

export function migratePersisted(raw: unknown): PersistedData {
  const s = (raw ?? {}) as Partial<PersistedData> & { version?: number };
  const spans = (s.spans ?? DEFAULT_SPANS).map((span) => withDefaultThreads(span as Span));
  const sessions = (s.sessions ?? []).map((session) => ({
    ...session,
    threadId: session.threadId ?? null,
    concern: session.concern ?? "",
    rounds:
      typeof session.rounds === "number"
        ? session.rounds
        : session.source === "logged"
          ? 0
          : 1,
    quality: asQuality(session.quality),
  }));
  const timer = s.timer
    ? {
        ...s.timer,
        threadId: s.timer.threadId ?? pickFirstThread(spans, s.timer.spanId),
        pendingFeedbackId: s.timer.pendingFeedbackId ?? null,
      }
    : idleTimer(s.settings ?? defaultSettings, "confident", {
        threadId: pickFirstThread(spans, "confident"),
      });
  return {
    version: 4,
    onboardingComplete: Boolean(s.onboardingComplete),
    settings: { ...defaultSettings, ...s.settings },
    spans,
    sessions,
    checkIns: migrateCheckIns(s.checkIns),
    timer,
  };
}

function migrateCheckIns(raw: PersistedData["checkIns"] | undefined): CheckIn[] {
  const byDate = new Map<string, CheckIn>();
  for (const item of raw ?? []) {
    const legacy = item as CheckIn & {
      intention?: string;
      wins?: string;
      reflection?: string;
    };
    if (!legacy?.date) continue;
    const bits = [legacy.message, legacy.intention, legacy.wins, legacy.reflection]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    const message = [...new Set(bits)].join("\n");
    const prev = byDate.get(legacy.date);
    if (!prev) {
      byDate.set(legacy.date, {
        id: legacy.id || newId(),
        date: legacy.date,
        message,
        createdAt: legacy.createdAt ?? Date.now(),
      });
    } else if (message && !prev.message.includes(message)) {
      byDate.set(legacy.date, {
        ...prev,
        message: prev.message ? `${prev.message}\n${message}` : message,
      });
    }
  }
  return [...byDate.values()];
}

export const useT2xStore = create<T2xStore>()(
  persist(
    (set, get) => ({
      version: 4,
      hydrateDone: false,
      onboardingComplete: false,
      settings: defaultSettings,
      spans: DEFAULT_SPANS,
      sessions: [],
      checkIns: [],
      timer: defaultTimer,

      completeOnboarding: (name) => {
        const trimmed = name.trim() || "Friend";
        set({
          onboardingComplete: true,
          settings: { ...get().settings, displayName: trimmed },
        });
      },

      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        const timer = get().timer;
        if (timer.status === "idle") {
          const durationMs = msFor(timer.kind, settings);
          set({
            settings,
            timer: { ...timer, durationMs, remainingMs: durationMs },
          });
          return;
        }
        set({ settings });
      },

      addSpan: (input) => {
        const span: Span = {
          id: newId(),
          name: input.name.trim(),
          tagline: input.tagline.trim(),
          tone: input.tone,
          mode: input.mode,
          weeklyGoalMinutes: Math.max(30, input.weeklyGoalMinutes),
          weeklyGoalRounds: Math.max(1, input.weeklyGoalRounds),
          archived: false,
          threads: [],
        };
        set({ spans: [...get().spans, span] });
      },

      updateSpan: (id, patch) => {
        set({
          spans: get().spans.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },

      archiveSpan: (id) => {
        const live = get().spans.filter((s) => !s.archived);
        if (live.length <= 1) return;
        const spans = get().spans.map((s) => (s.id === id ? { ...s, archived: true } : s));
        const nextLive = spans.find((s) => !s.archived);
        const timer = get().timer;
        set({
          spans,
          timer:
            timer.spanId === id
              ? { ...timer, spanId: nextLive?.id ?? null, threadId: pickFirstThread(spans, nextLive?.id ?? null) }
              : timer,
        });
      },

      addThread: (spanId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const item: SubSpan = { id: newId(), name: trimmed, archived: false };
        set({
          spans: get().spans.map((s) =>
            s.id === spanId ? { ...s, threads: [...(s.threads ?? []), item] } : s,
          ),
        });
      },

      archiveThread: (spanId, threadId) => {
        const spans = get().spans.map((s) =>
          s.id === spanId
            ? { ...s, threads: (s.threads ?? []).map((t) => (t.id === threadId ? { ...t, archived: true } : t)) }
            : s,
        );
        const timer = get().timer;
        set({
          spans,
          timer: timer.threadId === threadId ? { ...timer, threadId: pickFirstThread(spans, timer.spanId) } : timer,
        });
      },

      setTimerSpan: (spanId) => {
        const timer = get().timer;
        if (timer.status === "running") return;
        const threadId = pickFirstThread(get().spans, spanId);
        set({ timer: { ...timer, spanId, threadId } });
      },

      setTimerThread: (threadId) => {
        const timer = get().timer;
        if (timer.status === "running") return;
        set({ timer: { ...timer, threadId } });
      },

      startTimer: () => {
        const { timer } = get();
        if (timer.status === "running") return;
        const remaining = timer.status === "paused" ? timer.remainingMs : timer.durationMs;
        const now = Date.now();
        set({
          timer: {
            ...timer,
            status: "running",
            remainingMs: remaining,
            endsAt: now + remaining,
          },
        });
      },

      pauseTimer: () => {
        const { timer } = get();
        if (timer.status !== "running") return;
        set({
          timer: {
            ...timer,
            status: "paused",
            remainingMs: remainingNow(timer),
            endsAt: null,
          },
        });
      },

      resumeTimer: () => {
        get().startTimer();
      },

      resetTimer: () => {
        const { timer, settings } = get();
        const durationMs = msFor(timer.kind, settings);
        set({
          timer: {
            ...timer,
            status: "idle",
            durationMs,
            remainingMs: durationMs,
            endsAt: null,
          },
        });
      },

      skipTimer: () => {
        const state = get();
        const { timer } = state;
        if (timer.kind === "focus") {
          const kind = nextKindAfterFocus(timer.cycleCount, state.settings);
          set({ timer: armKind(kind, state, { cycleCount: timer.cycleCount }) });
          return;
        }
        set({ timer: armKind("focus", state) });
      },

      completeTimer: () => {
        const state = get();
        const { timer } = state;
        if (timer.status !== "running" && timer.status !== "paused") return null;
        return sealFocusRound(state, timer.durationMs, Date.now(), set);
      },

      completeEarly: () => {
        const state = get();
        const { timer } = state;
        if (timer.status === "idle") return null;
        const left = remainingNow(timer);
        const elapsed = Math.max(60_000, timer.durationMs - left);
        return sealFocusRound(state, elapsed, Date.now(), set);
      },

      clearLastCompleted: () => {
        const { timer } = get();
        set({ timer: { ...timer, lastCompleted: null } });
      },

      saveRoundFeedback: (sessionId, concern, quality) => {
        const trimmed = concern.trim();
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId ? { ...s, concern: trimmed, quality } : s,
          ),
          timer: { ...get().timer, pendingFeedbackId: null },
        });
      },

      dismissRoundFeedback: () => {
        set({ timer: { ...get().timer, pendingFeedbackId: null } });
      },

      promptRoundFeedback: (sessionId) => {
        set({ timer: { ...get().timer, pendingFeedbackId: sessionId } });
      },

      logTime: (spanId, rounds, quality, note = "", threadId = null) => {
        const count = Math.max(1, Math.round(rounds));
        const durationMs = count * get().settings.focusMinutes * 60_000;
        const now = Date.now();
        const session: Session = {
          id: newId(),
          spanId,
          threadId: threadId ?? null,
          startedAt: now - durationMs,
          endedAt: now,
          durationMs,
          source: "logged",
          note: note.trim(),
          concern: "",
          rounds: count,
          quality,
        };
        set({ sessions: [...get().sessions, session] });
      },

      submitRounds: ({ spanId, threadId, rounds, quality, note = "" }) => {
        const count = Math.max(1, Math.round(rounds));
        const now = Date.now();
        const session: Session = {
          id: newId(),
          spanId,
          threadId,
          startedAt: now,
          endedAt: now,
          durationMs: 0,
          source: "count",
          note: "",
          concern: note.trim(),
          rounds: count,
          quality,
        };
        set({ sessions: [...get().sessions, session] });
      },

      removeSession: (id) => {
        set({ sessions: get().sessions.filter((s) => s.id !== id) });
      },

      saveCheckIn: (input) => {
        const date = input.date ?? new Intl.DateTimeFormat("en-CA").format(new Date());
        const existing = get().checkIns.find((c) => c.date === date);
        const entry: CheckIn = {
          id: existing?.id ?? newId(),
          date,
          message: input.message.trim(),
          createdAt: existing?.createdAt ?? Date.now(),
        };
        set({
          checkIns: existing
            ? get().checkIns.map((c) => (c.id === existing.id ? entry : c))
            : [...get().checkIns, entry],
        });
      },

      resetAll: () => {
        const timer = idleTimer(defaultSettings, "confident", { threadId: "confident-programming" });
        set({
          onboardingComplete: false,
          settings: defaultSettings,
          spans: DEFAULT_SPANS,
          sessions: [],
          checkIns: [],
          timer,
        });
        // WKWebView (Pake / iOS) can drop a storage write that is not followed
        // by an explicit remove + set. Persist already wrote the reset state.
        try {
          const raw = localStorage.getItem("t2x-store");
          localStorage.removeItem("t2x-store");
          if (raw) localStorage.setItem("t2x-store", raw);
        } catch {
          /* storage unavailable */
        }
      },
    }),
    {
      name: "t2x-store",
      version: 4,
      migrate: (persisted) => {
        try {
          return migratePersisted(persisted);
        } catch {
          return migratePersisted({});
        }
      },
      partialize: (s) => ({
        version: s.version,
        onboardingComplete: s.onboardingComplete,
        settings: s.settings,
        spans: s.spans,
        sessions: s.sessions,
        checkIns: s.checkIns,
        timer: s.timer,
      }),
      skipHydration: true,
    },
  ),
);

export function getTimerRemaining(timer: TimerState, now = Date.now()): number {
  return remainingNow(timer, now);
}

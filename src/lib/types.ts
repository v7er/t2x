export type Energy = 1 | 2 | 3 | 4 | 5;
export type RoundQuality = "bad" | "medium" | "good";
export type TimerKind = "focus" | "short-break" | "long-break";
export type TimerStatus = "idle" | "running" | "paused";
export type SpanTone = "sage" | "slate" | "clay" | "moss" | "mist";
export type SpanMode = "timed" | "count";
export type SessionSource = "focus" | "logged" | "count";

export interface SubSpan {
  id: string;
  name: string;
  archived: boolean;
}

export interface Span {
  id: string;
  name: string;
  tagline: string;
  tone: SpanTone;
  mode: SpanMode;
  weeklyGoalMinutes: number;
  weeklyGoalRounds: number;
  archived: boolean;
  threads: SubSpan[];
}

export interface Session {
  id: string;
  spanId: string;
  threadId: string | null;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  source: SessionSource;
  note: string;
  concern: string;
  rounds: number;
  quality: RoundQuality | null;
}

export interface CheckIn {
  id: string;
  date: string;
  message: string;
  createdAt: number;
}

export interface Settings {
  displayName: string;
  avatarUrl: string | null;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
}

export interface LastCompleted {
  kind: TimerKind;
  spanId: string | null;
  threadId: string | null;
  sessionId: string | null;
  minutes: number;
  at: number;
}

export interface TimerState {
  status: TimerStatus;
  kind: TimerKind;
  spanId: string | null;
  threadId: string | null;
  durationMs: number;
  remainingMs: number;
  endsAt: number | null;
  cycleCount: number;
  lastCompleted: LastCompleted | null;
  pendingFeedbackId: string | null;
}

export interface PersistedData {
  version: 4;
  onboardingComplete: boolean;
  settings: Settings;
  spans: Span[];
  sessions: Session[];
  checkIns: CheckIn[];
  timer: TimerState;
}

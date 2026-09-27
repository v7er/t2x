import { activeSpans } from "./spans";
import type { PersistedData } from "./types";
import { minutesOf, roundsOf, sessionsInWeek, sessionsOnDay, todayKey } from "./time";

export function todaySessions(state: PersistedData) {
  return sessionsOnDay(state.sessions, todayKey());
}

export function todayMinutes(state: PersistedData, spanId?: string, threadId?: string) {
  const list = todaySessions(state).filter((s) => {
    if (spanId && s.spanId !== spanId) return false;
    if (threadId && s.threadId !== threadId) return false;
    return true;
  });
  return minutesOf(list);
}

export function weekMinutes(state: PersistedData, spanId?: string, threadId?: string) {
  const list = sessionsInWeek(state.sessions).filter((s) => {
    if (spanId && s.spanId !== spanId) return false;
    if (threadId && s.threadId !== threadId) return false;
    return true;
  });
  return minutesOf(list);
}

export function weekRounds(state: PersistedData, spanId?: string, threadId?: string) {
  const list = sessionsInWeek(state.sessions).filter((s) => {
    if (spanId && s.spanId !== spanId) return false;
    if (threadId && s.threadId !== threadId) return false;
    return true;
  });
  return roundsOf(list);
}

export function todayRounds(state: PersistedData, spanId?: string, threadId?: string) {
  const list = todaySessions(state).filter((s) => {
    if (spanId && s.spanId !== spanId) return false;
    if (threadId && s.threadId !== threadId) return false;
    return true;
  });
  return roundsOf(list);
}

export function todayCheckIns(state: PersistedData) {
  const key = todayKey();
  return state.checkIns.filter((c) => c.date === key);
}

export function todayCheckIn(state: PersistedData) {
  return todayCheckIns(state)[0];
}

export function liveSpans(state: PersistedData) {
  return activeSpans(state.spans);
}

export function todayRoundCount(state: PersistedData) {
  return roundsOf(todaySessions(state));
}

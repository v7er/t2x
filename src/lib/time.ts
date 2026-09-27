import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import type { CheckIn, RoundQuality, Session, TimerKind } from "./types";
import { asQuality } from "./spans";

export function todayKey(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function formatDayLabel(d = new Date()): string {
  return format(d, "EEEE d MMMM");
}

export function formatShortDay(d: Date): string {
  return format(d, "EEE");
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatMinutes(total: number): string {
  const safe = Math.max(0, Math.round(total));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatMs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function weekBounds(d = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  };
}

export function weekDays(d = new Date()): Date[] {
  const { start, end } = weekBounds(d);
  return eachDayOfInterval({ start, end });
}

export function lastNDays(n: number, d = new Date()): Date[] {
  const start = addDays(d, -(n - 1));
  return eachDayOfInterval({ start, end: d });
}

export function isInRange(ts: number, start: Date, end: Date): boolean {
  return ts >= start.getTime() && ts <= end.getTime();
}

export function minutesOf(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMs / 60000, 0);
}

export function roundUnits(session: Session): number {
  if (typeof session.rounds === "number" && session.rounds > 0) return session.rounds;
  if (session.source === "logged") return 0;
  return session.source === "focus" || session.source === "count" ? 1 : 0;
}

export function roundsOf(sessions: Session[]): number {
  return sessions.reduce((sum, session) => sum + roundUnits(session), 0);
}

const QUALITY_SCORE: Record<RoundQuality, number> = { bad: 1, medium: 2, good: 3 };

export function averageQuality(sessions: Session[]): number | null {
  const scored = sessions.flatMap((session) => {
    const units = roundUnits(session);
    const quality = asQuality(session.quality);
    if (!units || !quality) return [];
    return [{ units, quality }];
  });
  if (!scored.length) return null;
  const weight = scored.reduce((sum, row) => sum + row.units, 0);
  const total = scored.reduce((sum, row) => sum + QUALITY_SCORE[row.quality] * row.units, 0);
  return weight ? total / weight : null;
}

export function roundMarks(sessions: Session[]): RoundQuality[] {
  const marks: RoundQuality[] = [];
  const ordered = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  for (const session of ordered) {
    const units = roundUnits(session);
    if (!units) continue;
    const quality = asQuality(session.quality) ?? "good";
    for (let i = 0; i < units; i += 1) marks.push(quality);
  }
  return marks;
}

export function sessionAmount(session: Session): string {
  const rounds = roundUnits(session);
  if (session.source === "count" || session.source === "logged") {
    return `${rounds} ${rounds === 1 ? "round" : "rounds"}`;
  }
  return formatMinutes(session.durationMs / 60000);
}

export function sessionsOnDay(sessions: Session[], key: string): Session[] {
  return sessions.filter((s) => todayKey(new Date(s.startedAt)) === key);
}

export function sessionsInWeek(sessions: Session[], d = new Date()): Session[] {
  const { start, end } = weekBounds(d);
  return sessions.filter((s) => isInRange(s.startedAt, start, end));
}

export function kindLabel(kind: TimerKind): string {
  if (kind === "focus") return "Round";
  if (kind === "short-break") return "Short rest";
  return "Long rest";
}

export function computeStreak(sessions: Session[], checkIns: CheckIn[], now = new Date()): number {
  const active = new Set<string>();
  for (const s of sessions) active.add(todayKey(new Date(s.startedAt)));
  for (const c of checkIns) active.add(c.date);

  let cursor = now;
  let key = todayKey(cursor);
  if (!active.has(key)) {
    cursor = addDays(cursor, -1);
    key = todayKey(cursor);
    if (!active.has(key)) return 0;
  }

  let streak = 0;
  while (active.has(todayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
    if (streak > 730) break;
  }
  return streak;
}

export function dayActivity(sessions: Session[], checkIns: CheckIn[], key: string) {
  const daySessions = sessionsOnDay(sessions, key);
  const note = checkIns.find((c) => c.date === key);
  return {
    minutes: minutesOf(daySessions),
    rounds: roundsOf(daySessions),
    quality: averageQuality(daySessions),
    message: note?.message ?? "",
  };
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(differenceInCalendarDays(new Date(a), new Date(b)));
}

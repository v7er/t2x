import type { RoundQuality, Span, SpanMode, SpanTone, SubSpan } from "./types";

export const TONE_VAR: Record<SpanTone, string> = {
  sage: "var(--color-tone-sage)",
  slate: "var(--color-tone-slate)",
  clay: "var(--color-tone-clay)",
  moss: "var(--color-tone-moss)",
  mist: "var(--color-tone-mist)",
};

export const TONE_ORDER: SpanTone[] = ["sage", "slate", "clay", "moss", "mist"];

function thread(id: string, name: string): SubSpan {
  return { id, name, archived: false };
}

export function defaultThreadsFor(spanId: string): SubSpan[] {
  if (spanId === "confident") {
    return [
      thread("confident-programming", "Programming skill"),
      thread("confident-english", "English language"),
      thread("confident-speaking", "Speaking skill"),
    ];
  }
  if (spanId === "controlled") {
    return [thread("controlled-planning", "Planning"), thread("controlled-roadmap", "Goal / Roadmap")];
  }
  if (spanId === "care") {
    return [thread("care-play", "Play with kid"), thread("care-family", "Family time")];
  }
  return [];
}

function span(
  id: string,
  name: string,
  tagline: string,
  tone: SpanTone,
  mode: SpanMode,
  weeklyGoalMinutes: number,
  weeklyGoalRounds: number,
): Span {
  return {
    id,
    name,
    tagline,
    tone,
    mode,
    weeklyGoalMinutes,
    weeklyGoalRounds,
    archived: false,
    threads: defaultThreadsFor(id),
  };
}

export const DEFAULT_SPANS: Span[] = [
  span("confident", "Confident", "Knowledge, languages, speaking, craft", "sage", "timed", 480, 12),
  span("controlled", "Controlled", "Live well, plan, stay on course", "slate", "count", 300, 14),
  span("care", "Care", "Presence with children and family", "clay", "timed", 600, 10),
];

export const SUGGESTED_SPANS: Omit<Span, "id" | "archived">[] = [
  {
    name: "Body",
    tagline: "Movement, health, sleep hygiene",
    tone: "moss",
    mode: "count",
    weeklyGoalMinutes: 180,
    weeklyGoalRounds: 12,
    threads: [],
  },
  {
    name: "Craft",
    tagline: "Making things that outlast the day",
    tone: "mist",
    mode: "timed",
    weeklyGoalMinutes: 240,
    weeklyGoalRounds: 8,
    threads: [],
  },
  {
    name: "Rest",
    tagline: "Recovery is time well spent",
    tone: "slate",
    mode: "count",
    weeklyGoalMinutes: 120,
    weeklyGoalRounds: 7,
    threads: [],
  },
];

export function activeSpans(spans: Span[]): Span[] {
  return spans.filter((s) => !s.archived);
}

export function activeThreads(span: Span | undefined): SubSpan[] {
  if (!span) return [];
  return (span.threads ?? []).filter((t) => !t.archived);
}

export function spanById(spans: Span[], id: string | null): Span | undefined {
  if (!id) return undefined;
  return spans.find((s) => s.id === id);
}

export function threadById(spans: Span[], id: string | null): SubSpan | undefined {
  if (!id) return undefined;
  for (const spanItem of spans) {
    const found = (spanItem.threads ?? []).find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

export function nextTone(spans: Span[]): SpanTone {
  const used = new Set(activeSpans(spans).map((s) => s.tone));
  return TONE_ORDER.find((t) => !used.has(t)) ?? TONE_ORDER[spans.length % TONE_ORDER.length];
}

export function ensureSpan(item: Span): Span {
  const threads = Array.isArray(item.threads) ? item.threads : defaultThreadsFor(item.id);
  const mode: SpanMode = item.mode === "count" || item.mode === "timed" ? item.mode : item.id === "controlled" ? "count" : "timed";
  const weeklyGoalRounds = item.weeklyGoalRounds > 0 ? item.weeklyGoalRounds : mode === "count" ? 14 : 12;
  return { ...item, threads, mode, weeklyGoalRounds };
}

export function withDefaultThreads(item: Span): Span {
  const shaped = ensureSpan(item);
  const defaults = defaultThreadsFor(shaped.id);
  if (!defaults.length) return shaped;
  const ids = new Set(shaped.threads.map((t) => t.id));
  const missing = defaults.filter((t) => !ids.has(t.id));
  if (!missing.length) return shaped;
  return { ...shaped, threads: [...shaped.threads, ...missing] };
}

export const QUALITY_COLOR: Record<RoundQuality, string> = {
  bad: "#f08a3c",
  medium: "#f0c84a",
  good: "#3ddb7a",
};

export function asQuality(value: unknown): RoundQuality | null {
  if (value === "bad" || value === "medium" || value === "good") return value;
  if (value === 1 || value === 2) return "bad";
  if (value === 3) return "medium";
  if (value === 4 || value === 5) return "good";
  return null;
}

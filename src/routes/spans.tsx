import { useState } from "react";
import { Button, Modal, NumberInput, Select, TextInput, Textarea } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { LogTimeModal } from "@/components/log-time-modal";
import { CountRoundModal } from "@/components/count-round";
import { todayMinutes, weekMinutes, weekRounds } from "@/lib/selectors";
import { SUGGESTED_SPANS, TONE_VAR, activeSpans, activeThreads, nextTone } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import { formatMinutes } from "@/lib/time";
import type { Span, SpanMode, SpanTone } from "@/lib/types";

export const Route = createFileRoute("/spans")({ component: SpansPage });

const TONE_OPTIONS = [
  { value: "sage", label: "Sage" },
  { value: "slate", label: "Slate" },
  { value: "clay", label: "Clay" },
  { value: "moss", label: "Moss" },
  { value: "mist", label: "Mist" },
];

function SpansPage() {
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const addSpan = useT2xStore((s) => s.addSpan);
  const [logSpan, setLogSpan] = useState<string | null>(null);
  const [countSpan, setCountSpan] = useState<string | null>(null);
  const [editing, setEditing] = useState<Span | null>(null);
  const [creating, setCreating] = useState(false);

  const usedNames = new Set(spans.map((s) => s.name.toLowerCase()));
  const suggestions = SUGGESTED_SPANS.filter((s) => !usedNames.has(s.name.toLowerCase()));

  return (
    <div className="page-enter flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-fg">Spans</h1>
          <p className="mt-1 max-w-md text-sm text-muted">
            Each span is either a timed round or a count you submit. Threads sit underneath.
          </p>
        </div>
        <Button
          variant="default"
          leftSection={<Plus className="size-4" strokeWidth={1.75} />}
          onClick={() => setCreating(true)}
        >
          Add
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        {spans.map((span) => (
          <SpanCard
            key={span.id}
            span={span}
            onEdit={() => setEditing(span)}
            onLog={() => (span.mode === "count" ? setCountSpan(span.id) : setLogSpan(span.id))}
          />
        ))}
      </div>

      {suggestions.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-fg">Suggested</h2>
          <div className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() =>
                  addSpan({
                    name: s.name,
                    tagline: s.tagline,
                    tone: s.tone,
                    mode: s.mode,
                    weeklyGoalMinutes: s.weeklyGoalMinutes,
                    weeklyGoalRounds: s.weeklyGoalRounds,
                  })
                }
                className="flex min-h-11 items-center justify-between rounded-lg bg-surface px-4 py-3 text-left shadow-border transition-[box-shadow] duration-150 hover:shadow-border-hover"
              >
                <span>
                  <span className="block text-sm font-medium text-fg">{s.name}</span>
                  <span className="block text-sm text-muted">{s.tagline}</span>
                </span>
                <Plus className="size-4 text-subtle" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <LogTimeModal opened={Boolean(logSpan)} onClose={() => setLogSpan(null)} defaultSpanId={logSpan} />
      <CountRoundModal opened={Boolean(countSpan)} onClose={() => setCountSpan(null)} spanId={countSpan} />
      <SpanEditor opened={creating} onClose={() => setCreating(false)} mode="create" />
      <SpanEditor opened={Boolean(editing)} onClose={() => setEditing(null)} mode="edit" span={editing} />
    </div>
  );
}

function SpanCard({
  span,
  onEdit,
  onLog,
}: {
  span: Span;
  onEdit: () => void;
  onLog: () => void;
}) {
  const week = useT2xStore((s) => weekMinutes(s, span.id));
  const rounds = useT2xStore((s) => weekRounds(s, span.id));
  const today = useT2xStore((s) => todayMinutes(s, span.id));
  const addThread = useT2xStore((s) => s.addThread);
  const archiveThread = useT2xStore((s) => s.archiveThread);
  const [draft, setDraft] = useState("");
  const live = useT2xStore((s) => s.spans.find((item) => item.id === span.id));
  const threads = activeThreads(live ?? span);
  const counting = span.mode === "count";
  const goal = counting ? Math.max(span.weeklyGoalRounds, 1) : Math.max(span.weeklyGoalMinutes, 1);
  const current = counting ? rounds : week;
  const pct = Math.min(100, (current / goal) * 100);

  return (
    <article className="rounded-xl bg-surface p-5 shadow-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 size-2.5 shrink-0 rounded-full"
            style={{ background: TONE_VAR[span.tone] }}
          />
          <div>
            <h2 className="text-base font-medium text-fg">{span.name}</h2>
            <p className="text-sm text-muted">{span.tagline}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-subtle">
              {counting ? "Count rounds" : "Timed rounds"}
            </p>
          </div>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {Math.round(pct)}
          <span className="text-subtle">%</span>
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-fg/8">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TONE_VAR[span.tone] }} />
      </div>
      <p className="mt-2 text-sm tabular-nums text-subtle">
        {counting
          ? `${rounds} of ${goal} rounds this week`
          : `${formatMinutes(week)} of ${formatMinutes(goal)} this week${today > 0 ? ` · ${formatMinutes(today)} today` : ""}`}
      </p>

      <ul className="mt-4 flex flex-col gap-1.5">
        {threads.map((thread) => (
          <ThreadRow
            key={thread.id}
            spanId={span.id}
            threadId={thread.id}
            counting={counting}
            onArchive={() => archiveThread(span.id, thread.id)}
          />
        ))}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addThread(span.id, draft);
          setDraft("");
        }}
      >
        <TextInput
          placeholder="Add a thread"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          className="flex-1"
          size="sm"
        />
        <Button type="submit" variant="default" size="sm" disabled={!draft.trim()}>
          Add
        </Button>
      </form>

      <div className="mt-4 flex gap-2">
        <Button variant="default" size="sm" onClick={onLog}>
          {counting ? "Log rounds" : "Log time"}
        </Button>
        <Button variant="subtle" color="gray" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </article>
  );
}

function ThreadRow({
  spanId,
  threadId,
  counting,
  onArchive,
}: {
  spanId: string;
  threadId: string;
  counting: boolean;
  onArchive: () => void;
}) {
  const span = useT2xStore((s) => s.spans.find((item) => item.id === spanId));
  const thread = (span?.threads ?? []).find((t) => t.id === threadId);
  const minutes = useT2xStore((s) => weekMinutes(s, spanId, threadId));
  const rounds = useT2xStore((s) => weekRounds(s, spanId, threadId));
  if (!thread) return null;
  return (
    <li className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface-2 px-3">
      <span className="text-sm text-fg">{thread.name}</span>
      <span className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-subtle">
          {counting ? `${rounds} rounds` : formatMinutes(minutes)}
        </span>
        <button type="button" onClick={onArchive} className="text-xs text-subtle hover:text-fg">
          Remove
        </button>
      </span>
    </li>
  );
}

function SpanEditor({
  opened,
  onClose,
  mode,
  span,
}: {
  opened: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  span?: Span | null;
}) {
  const addSpan = useT2xStore((s) => s.addSpan);
  const updateSpan = useT2xStore((s) => s.updateSpan);
  const archiveSpan = useT2xStore((s) => s.archiveSpan);
  const all = useT2xStore((s) => s.spans);
  const [name, setName] = useState(span?.name ?? "");
  const [tagline, setTagline] = useState(span?.tagline ?? "");
  const [tone, setTone] = useState<SpanTone>(span?.tone ?? nextTone(all));
  const [spanMode, setSpanMode] = useState<SpanMode>(span?.mode ?? "timed");
  const [goal, setGoal] = useState(span?.weeklyGoalMinutes ?? 180);
  const [roundGoal, setRoundGoal] = useState(span?.weeklyGoalRounds ?? 12);

  const key = `${mode}-${span?.id ?? "new"}-${opened}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setName(span?.name ?? "");
    setTagline(span?.tagline ?? "");
    setTone(span?.tone ?? nextTone(all));
    setSpanMode(span?.mode ?? "timed");
    setGoal(span?.weeklyGoalMinutes ?? 180);
    setRoundGoal(span?.weeklyGoalRounds ?? 12);
  }

  function save() {
    if (!name.trim()) return;
    if (mode === "create") {
      addSpan({
        name: name.trim(),
        tagline: tagline.trim(),
        tone,
        mode: spanMode,
        weeklyGoalMinutes: goal,
        weeklyGoalRounds: roundGoal,
      });
    } else if (span) {
      updateSpan(span.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        tone,
        mode: spanMode,
        weeklyGoalMinutes: goal,
        weeklyGoalRounds: roundGoal,
      });
    }
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={mode === "create" ? "New span" : "Edit span"} size="sm">
      <div className="flex flex-col gap-4">
        <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <Textarea
          label="Tagline"
          minRows={2}
          value={tagline}
          onChange={(e) => setTagline(e.currentTarget.value)}
        />
        <Select
          label="Tone"
          data={TONE_OPTIONS}
          value={tone}
          onChange={(v) => v && setTone(v as SpanTone)}
          allowDeselect={false}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-fg">Kind</p>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton active={spanMode === "timed"} onClick={() => setSpanMode("timed")}>
              Timed round
            </ModeButton>
            <ModeButton active={spanMode === "count"} onClick={() => setSpanMode("count")}>
              Count rounds
            </ModeButton>
          </div>
          <p className="mt-2 text-xs text-subtle">
            {spanMode === "timed"
              ? "A clock. Seal the round, then note its quality."
              : "No clock. Enter how many rounds you finished and submit."}
          </p>
        </div>
        {spanMode === "count" ? (
          <NumberInput
            label="Weekly goal (rounds)"
            min={1}
            step={1}
            value={roundGoal}
            onChange={(v) => setRoundGoal(typeof v === "number" ? v : 12)}
          />
        ) : (
          <NumberInput
            label="Weekly goal (minutes)"
            min={30}
            step={30}
            value={goal}
            onChange={(v) => setGoal(typeof v === "number" ? v : 180)}
          />
        )}
        <Button onClick={save} fullWidth>
          Save
        </Button>
        {mode === "edit" && span ? (
          <Button
            variant="subtle"
            color="red"
            onClick={() => {
              archiveSpan(span.id);
              onClose();
            }}
          >
            Archive span
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "min-h-11 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
          : "min-h-11 rounded-md bg-surface-2 px-3 text-sm font-medium text-muted"
      }
    >
      {children}
    </button>
  );
}

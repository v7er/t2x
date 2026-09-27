import { useEffect, useState } from "react";
import { Button, Modal, NumberInput, Select, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { QualityPick } from "@/components/quality-pick";
import { activeSpans, activeThreads } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import type { RoundQuality } from "@/lib/types";

export function LogTimeModal({
  opened,
  onClose,
  defaultSpanId,
}: {
  opened: boolean;
  onClose: () => void;
  defaultSpanId?: string | null;
}) {
  const spans = activeSpans(useT2xStore((s) => s.spans));
  const logTime = useT2xStore((s) => s.logTime);
  const [spanId, setSpanId] = useState<string | null>(defaultSpanId ?? spans[0]?.id ?? null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [rounds, setRounds] = useState(1);
  const [quality, setQuality] = useState<RoundQuality>("good");
  const [note, setNote] = useState("");

  const span = spans.find((s) => s.id === spanId);
  const threads = activeThreads(span);

  useEffect(() => {
    if (!opened) return;
    const first = useT2xStore.getState().spans.find((s) => !s.archived)?.id ?? null;
    const nextSpan = defaultSpanId ?? first;
    setSpanId(nextSpan);
    const nextThreads = activeThreads(useT2xStore.getState().spans.find((s) => s.id === nextSpan));
    setThreadId(nextThreads[0]?.id ?? null);
    setRounds(1);
    setQuality("good");
    setNote("");
  }, [opened, defaultSpanId]);

  function submit() {
    if (!spanId) return;
    const count = Math.max(1, Math.round(rounds) || 1);
    logTime(spanId, count, quality, note, threadId);
    const thread = threads.find((t) => t.id === threadId);
    notifications.show({
      title: count === 1 ? "1 round logged" : `${count} rounds logged`,
      message: `Toward ${[span?.name, thread?.name].filter(Boolean).join(" · ")}`,
      color: "sage",
    });
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Log rounds" size="sm">
      <div className="flex flex-col gap-4">
        <Select
          label="Span"
          data={spans.map((s) => ({ value: s.id, label: s.name }))}
          value={spanId}
          onChange={(v) => {
            setSpanId(v);
            const next = activeThreads(spans.find((s) => s.id === v));
            setThreadId(next[0]?.id ?? null);
          }}
          allowDeselect={false}
        />
        {threads.length > 0 ? (
          <Select
            label="Thread"
            data={threads.map((t) => ({ value: t.id, label: t.name }))}
            value={threadId}
            onChange={setThreadId}
            allowDeselect={false}
          />
        ) : null}
        <NumberInput
          label="Rounds"
          description="Each round fills today’s bar."
          min={1}
          max={24}
          value={rounds}
          onChange={(v) => setRounds(typeof v === "number" ? v : 1)}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-fg">How was it</p>
          <QualityPick value={quality} onChange={setQuality} />
        </div>
        <Textarea
          label="Note"
          placeholder="Optional"
          minRows={2}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />
        <Button onClick={submit} fullWidth>
          Save {Math.max(1, Math.round(rounds) || 1)} {rounds === 1 ? "round" : "rounds"}
        </Button>
      </div>
    </Modal>
  );
}

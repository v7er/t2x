import { useEffect, useState } from "react";
import { Button, Modal, NumberInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { QualityPick } from "@/components/quality-pick";
import { activeThreads, spanById } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import type { RoundQuality } from "@/lib/types";

export function CountRoundForm({
  spanId,
  onSubmitted,
}: {
  spanId: string | null;
  onSubmitted?: () => void;
}) {
  const spans = useT2xStore((s) => s.spans);
  const submitRounds = useT2xStore((s) => s.submitRounds);
  const setTimerThread = useT2xStore((s) => s.setTimerThread);
  const timerThread = useT2xStore((s) => s.timer.threadId);
  const span = spanById(spans, spanId);
  const threads = activeThreads(span);
  const [threadId, setThreadId] = useState<string | null>(timerThread);
  const [rounds, setRounds] = useState(1);
  const [quality, setQuality] = useState<RoundQuality>("good");
  const [note, setNote] = useState("");

  useEffect(() => {
    const live = activeThreads(spanById(useT2xStore.getState().spans, spanId));
    const preferred = useT2xStore.getState().timer.threadId;
    setThreadId(live.some((t) => t.id === preferred) ? preferred : (live[0]?.id ?? null));
    setRounds(1);
    setQuality("good");
    setNote("");
  }, [spanId]);

  function submit() {
    if (!spanId) return;
    const count = Math.max(1, Math.round(rounds) || 1);
    submitRounds({ spanId, threadId, rounds: count, quality, note });
    notifications.show({
      title: count === 1 ? "1 round logged" : `${count} rounds logged`,
      message: span ? `Toward ${span.name}` : "Saved on this device",
      color: "sage",
    });
    setRounds(1);
    setNote("");
    onSubmitted?.();
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {threads.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-fg">Thread</p>
          <div className="flex flex-wrap gap-2">
            {threads.map((thread) => {
              const on = thread.id === threadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setThreadId(thread.id);
                    setTimerThread(thread.id);
                  }}
                  className={
                    on
                      ? "min-h-11 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg"
                      : "min-h-11 rounded-md bg-surface-2 px-3.5 text-sm font-medium text-muted"
                  }
                >
                  {thread.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <NumberInput
        label="Rounds"
        description="How many you finished. No clock."
        min={1}
        max={99}
        value={rounds}
        onChange={(v) => setRounds(typeof v === "number" ? v : 1)}
      />
      <div>
        <p className="mb-2 text-sm font-medium text-fg">How was it</p>
        <QualityPick value={quality} onChange={setQuality} />
      </div>
      <Textarea
        label="Note"
        placeholder="Optional — what this round was"
        minRows={2}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
      />
      <Button onClick={submit} fullWidth disabled={!spanId}>
        Submit rounds
      </Button>
    </div>
  );
}

export function CountRoundModal({
  opened,
  onClose,
  spanId,
}: {
  opened: boolean;
  onClose: () => void;
  spanId: string | null;
}) {
  const name = useT2xStore((s) => s.spans.find((span) => span.id === spanId)?.name);
  return (
    <Modal opened={opened} onClose={onClose} title={name ? `Rounds · ${name}` : "Log rounds"} size="sm">
      {opened ? <CountRoundForm spanId={spanId} onSubmitted={onClose} /> : null}
    </Modal>
  );
}

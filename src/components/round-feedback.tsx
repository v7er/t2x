import { useEffect, useState } from "react";
import { Button, Modal, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { QualityPick } from "@/components/quality-pick";
import { spanById, threadById } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";
import type { RoundQuality } from "@/lib/types";
import { formatMinutes } from "@/lib/time";

export function RoundFeedback() {
  const pendingId = useT2xStore((s) => s.timer.pendingFeedbackId);
  const sessions = useT2xStore((s) => s.sessions);
  const spans = useT2xStore((s) => s.spans);
  const saveRoundFeedback = useT2xStore((s) => s.saveRoundFeedback);
  const dismissRoundFeedback = useT2xStore((s) => s.dismissRoundFeedback);
  const session = sessions.find((s) => s.id === pendingId);
  const [concern, setConcern] = useState("");
  const [quality, setQuality] = useState<RoundQuality>("good");

  useEffect(() => {
    setConcern(session?.concern ?? "");
    setQuality(session?.quality ?? "good");
  }, [session?.id, session?.concern, session?.quality]);

  if (!session) return null;

  const sealed = session;
  const span = spanById(spans, sealed.spanId);
  const thread = threadById(spans, sealed.threadId);
  const toward = [span?.name, thread?.name].filter(Boolean).join(" · ");

  function save() {
    saveRoundFeedback(sealed.id, concern, quality);
    notifications.show({
      title: "Round noted",
      message: toward ? `Saved toward ${toward}` : "Feedback saved",
      color: "sage",
    });
  }

  return (
    <Modal opened onClose={dismissRoundFeedback} title="Round sealed" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {formatMinutes(sealed.durationMs / 60000)}
          {toward ? ` toward ${toward}` : ""}. How was this round?
        </p>
        <QualityPick value={quality} onChange={setQuality} />
        <Textarea
          label="Concern"
          placeholder="Optional — what stayed with you"
          minRows={3}
          value={concern}
          onChange={(e) => setConcern(e.currentTarget.value)}
        />
        <Button onClick={save} fullWidth>
          Save
        </Button>
        <Button variant="subtle" color="gray" onClick={dismissRoundFeedback}>
          Skip for now
        </Button>
      </div>
    </Modal>
  );
}

import { useRef, useState } from "react";
import { Button, Modal, TextInput } from "@mantine/core";
import { ImagePlus } from "lucide-react";
import { avatarFromFile, avatarFromUrl, avatarSrc } from "@/lib/avatar";
import { useT2xStore } from "@/lib/store";

export function AvatarPicker({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const stored = useT2xStore((s) => s.settings.avatarUrl);
  const updateSettings = useT2xStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = avatarSrc(stored);

  async function apply(next: string | null) {
    updateSettings({ avatarUrl: next });
    setError(null);
    onClose();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await apply(await avatarFromFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that file");
    } finally {
      setBusy(false);
    }
  }

  async function onUrl() {
    setBusy(true);
    setError(null);
    try {
      await apply(await avatarFromUrl(url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Center image" size="sm">
      <div className="flex flex-col gap-4">
        <div className="mx-auto size-28 overflow-hidden rounded-full shadow-border">
          <img src={preview} alt="" className="size-full object-cover" />
        </div>
        <p className="text-center text-sm text-muted">
          The zen mark is the default. Replace it with a file from this computer or a link.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button
          variant="default"
          fullWidth
          disabled={busy}
          leftSection={<ImagePlus className="size-4" strokeWidth={1.75} />}
          onClick={() => fileRef.current?.click()}
        >
          Choose from computer
        </Button>

        <TextInput
          label="Image URL"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void onUrl();
            }
          }}
        />
        <Button variant="filled" fullWidth disabled={busy || !url.trim()} onClick={() => void onUrl()}>
          Use link
        </Button>

        {error ? <p className="text-sm text-muted">{error}</p> : null}

        {stored ? (
          <button
            type="button"
            className="text-sm text-subtle underline-offset-4 hover:text-fg hover:underline"
            onClick={() => void apply(null)}
          >
            Return to zen mark
          </button>
        ) : null}
      </div>
    </Modal>
  );
}

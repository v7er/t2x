import { useState } from "react";
import { Button, Drawer, SegmentedControl, Stack, Text, TextInput } from "@mantine/core";
import { AvatarPicker } from "./avatar-picker";
import { InstallGuide } from "./install-sheet";
import { avatarSrc } from "@/lib/avatar";
import { playChime } from "@/lib/chime";
import { useT2xStore } from "@/lib/store";

export function SettingsDrawer({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const settings = useT2xStore((s) => s.settings);
  const updateSettings = useT2xStore((s) => s.updateSettings);
  const resetAll = useT2xStore((s) => s.resetAll);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function close() {
    setConfirmReset(false);
    onClose();
  }

  return (
    <Drawer opened={opened} onClose={close} title="Settings" position="right" size="sm">
      <Stack gap="lg">
        <TextInput
          label="Name"
          value={settings.displayName}
          onChange={(e) => updateSettings({ displayName: e.currentTarget.value })}
        />
        <div>
          <Text size="sm" fw={500} mb={8}>
            Center image
          </Text>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-md bg-surface px-3 py-2 text-left shadow-border"
            onClick={() => setAvatarOpen(true)}
          >
            <img src={avatarSrc(settings.avatarUrl)} alt="" className="size-11 rounded-full object-cover" />
            <span className="text-sm text-fg">Change zen mark or photo</span>
          </button>
        </div>
        <div>
          <Text size="sm" fw={500} mb={8}>
            Round length
          </Text>
          <SegmentedControl
            fullWidth
            value={String(settings.focusMinutes)}
            onChange={(v) => updateSettings({ focusMinutes: Number(v) })}
            data={["15", "20", "25", "45", "50"]}
          />
        </div>
        <div>
          <Text size="sm" fw={500} mb={8}>
            Short rest
          </Text>
          <SegmentedControl
            fullWidth
            value={String(settings.shortBreakMinutes)}
            onChange={(v) => updateSettings({ shortBreakMinutes: Number(v) })}
            data={["5", "8", "10"]}
          />
        </div>
        <div>
          <Text size="sm" fw={500} mb={8}>
            Long rest
          </Text>
          <SegmentedControl
            fullWidth
            value={String(settings.longBreakMinutes)}
            onChange={(v) => updateSettings({ longBreakMinutes: Number(v) })}
            data={["15", "20", "30"]}
          />
        </div>
        <div>
          <Text size="sm" fw={500} mb={8}>
            Rounds until long rest
          </Text>
          <SegmentedControl
            fullWidth
            value={String(settings.sessionsUntilLongBreak)}
            onChange={(v) => updateSettings({ sessionsUntilLongBreak: Number(v) })}
            data={["3", "4", "5"]}
          />
        </div>
        <div className="rounded-lg bg-surface p-4 shadow-border">
          <Text size="sm" fw={500} mb={10}>
            Keys
          </Text>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li className="flex items-center justify-between gap-3">
              Command
              <span className="text-xs text-subtle">⌘K</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              Start / pause
              <span className="text-xs text-subtle">Space</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              Jump to round
              <span className="text-xs text-subtle">⌘↵</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              Open command
              <span className="text-xs text-subtle">/</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted">A bell rings when a round ends.</p>
          <button
            type="button"
            className="mt-2 text-sm text-accent underline-offset-4 hover:underline"
            onClick={() => void playChime("focus")}
          >
            Ring now
          </button>
        </div>
        <InstallGuide />
        <div className="rounded-lg bg-surface p-4 shadow-border">
          <Text size="sm" fw={500} mb={6}>
            This device only
          </Text>
          <Text size="sm" c="dimmed" mb={12}>
            T2x is offline-first. Rounds, spans, and check-ins stay here — no account,
            no server. Reset clears this device.
          </Text>
          {confirmReset ? (
            <div className="flex flex-col gap-2">
              <Text size="sm" c="dimmed">
                Erase rounds, check-ins, and spans on this device?
              </Text>
              <div className="flex gap-2">
                <Button variant="default" className="flex-1" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button
                  color="red"
                  className="flex-1"
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                    close();
                  }}
                >
                  Erase
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" color="red" fullWidth onClick={() => setConfirmReset(true)}>
              Reset local data
            </Button>
          )}
        </div>
      </Stack>
      <AvatarPicker opened={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </Drawer>
  );
}

import { Text } from "@mantine/core";
import { installHint, isStandaloneApp } from "@/lib/native";

export function InstallGuide() {
  const hint = installHint();
  const installed = isStandaloneApp();

  return (
    <div className="rounded-lg bg-surface p-4 shadow-border">
      <Text size="sm" fw={500} mb={6}>
        Mac and iPhone
      </Text>
      {installed ? (
        <Text size="sm" c="dimmed">
          T2x is installed on this device. Rounds stay here, with no network required.
        </Text>
      ) : hint === "ios" ? (
        <div className="flex flex-col gap-2 text-sm text-muted">
          <p>Add T2x to the Home Screen. It opens as an app and keeps working offline.</p>
          <ol className="flex list-decimal flex-col gap-1 pl-4">
            <li>Tap Share in Safari</li>
            <li>Add to Home Screen</li>
            <li>Open T2x from the new icon</li>
          </ol>
        </div>
      ) : hint === "mac" ? (
        <div className="flex flex-col gap-2 text-sm text-muted">
          <p>Two ways to keep T2x on the Mac, both local-first:</p>
          <ul className="flex list-disc flex-col gap-1 pl-4">
            <li>Safari: File → Add to Dock</li>
            <li>Use the T2x Mac app from chat (first open: right-click → Open)</li>
          </ul>
        </div>
      ) : (
        <Text size="sm" c="dimmed">
          On iPhone: Safari Share → Add to Home Screen. On Mac: Add to Dock, or the T2x app.
          Everything stays on the device.
        </Text>
      )}
    </div>
  );
}

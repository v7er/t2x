import { useEffect, useState, type ReactNode } from "react";
import { ActionIcon, AppShell } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Layers,
  Search,
  Settings,
  Sun,
  Timer,
} from "lucide-react";
import { LogoMark, LogoWordmark } from "./logo";
import { CommandPalette } from "./command-palette";
import { FocusLock } from "./focus-lock";
import { Onboarding } from "./onboarding";
import { RoundFeedback } from "./round-feedback";
import { SettingsDrawer } from "./settings-drawer";
import { TimerWatcher } from "./timer-watcher";
import { cn } from "@/lib/cn";
import { todayMinutes } from "@/lib/selectors";
import { getTimerRemaining, useT2xStore } from "@/lib/store";
import { formatMinutes, formatMs } from "@/lib/time";
import { registerOfflineWorker, useOnline } from "@/lib/offline";
import { isNativeDesktop } from "@/lib/native";
import { useHydrated } from "@/lib/use-hydrated";

const NAV = [
  { to: "/", label: "Today", short: "Today", icon: Sun },
  { to: "/focus", label: "Round", short: "Round", icon: Timer },
  { to: "/spans", label: "Spans", short: "Spans", icon: Layers },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function RunningClock() {
  const timer = useT2xStore((s) => s.timer);
  const minutes = useT2xStore(todayMinutes);
  const [now, setNow] = useState(Date.now());
  const running = timer.status === "running";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  if (running) {
    return (
      <span className="font-medium tabular-nums text-accent">
        {formatMs(getTimerRemaining(timer, now))}
      </span>
    );
  }
  return <span className="tabular-nums text-muted">{formatMinutes(minutes)} today</span>;
}

export function AppFrame({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const onboarded = useT2xStore((s) => s.onboardingComplete);
  const online = useOnline();
  const isDesktop = useMediaQuery("(min-width: 48em)", false, {
    getInitialValueInEffect: false,
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [desktopShell, setDesktopShell] = useState(false);
  const timerStatus = useT2xStore((s) => s.timer.status);

  useEffect(() => {
    registerOfflineWorker();
  }, []);

  useEffect(() => {
    if (!isNativeDesktop()) return;
    setDesktopShell(true);
    document.documentElement.dataset.t2xDesktop = "1";
  }, []);

  useEffect(() => {
    if (timerStatus !== "running") return;
    setPaletteOpen(false);
    setSettingsOpen(false);
  }, [timerStatus]);

  if (!hydrated || !onboarded) {
    return <Onboarding ready={hydrated} />;
  }

  return (
    <AppShell
      header={{ height: "calc(58px + env(safe-area-inset-top, 0px))" }}
      navbar={{ width: 232, breakpoint: "sm", collapsed: { mobile: true } }}
      footer={{
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        collapsed: isDesktop ?? false,
      }}
      padding={0}
      withBorder={false}
    >
      <TimerWatcher />
      <FocusLock />
      <RoundFeedback />
      <AppShell.Header className="t2x-header">
        <div className={cn("flex h-full items-center justify-between px-4 sm:px-5", desktopShell && "pl-20")}>
          <Link to="/" className="flex items-center gap-2.5 text-fg no-underline">
            <LogoMark className="text-accent" />
            <LogoWordmark />
          </Link>
          <div className="flex items-center gap-3">
            {!online ? (
              <span className="text-xs font-medium tracking-wide text-subtle">Offline</span>
            ) : null}
            <RunningClock />
            <ActionIcon
              variant="subtle"
              color="gray"
              size={44}
              radius="md"
              aria-label="Command menu, Command K"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-5" strokeWidth={1.75} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size={44}
              radius="md"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-5" strokeWidth={1.75} />
            </ActionIcon>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Navbar className="t2x-navbar">
        <div className="flex h-full flex-col px-3 py-4">
          <p className="mb-4 px-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-subtle">
            Direct the day
          </p>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm no-underline transition-colors duration-150",
                    active
                      ? "bg-surface-2 text-fg shadow-[inset_2px_0_0_0_var(--color-accent)]"
                      : "text-muted hover:bg-surface-2/60 hover:text-fg",
                  )}
                >
                  <Icon
                    className={cn("size-[18px]", active && "text-accent")}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto px-3 font-display text-sm italic text-subtle">
            Master time. Expand your span.
          </p>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mt-3 flex min-h-11 w-full items-center justify-between rounded-md bg-surface px-3 text-left text-sm text-muted shadow-border"
          >
            Command
            <span className="font-sans text-[0.7rem] tracking-wide text-subtle">⌘K</span>
          </button>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </AppShell.Main>

      <AppShell.Footer className="t2x-footer">
        <nav className="grid h-full grid-cols-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium no-underline transition-colors duration-150",
                  active ? "text-accent" : "text-subtle",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2 : 1.75} />
                {item.short}
              </Link>
            );
          })}
        </nav>
      </AppShell.Footer>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSettings={() => setSettingsOpen(true)}
      />
      <SettingsDrawer opened={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  );
}

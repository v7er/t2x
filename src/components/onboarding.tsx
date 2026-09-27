import { useState } from "react";
import { Button } from "@mantine/core";
import { Logo } from "./logo";
import { DEFAULT_SPANS, TONE_VAR, activeThreads } from "@/lib/spans";
import { useT2xStore } from "@/lib/store";

export function Onboarding({ ready = true }: { ready?: boolean }) {
  const completeOnboarding = useT2xStore((s) => s.completeOnboarding);
  const [name, setName] = useState("");

  function begin() {
    if (!ready) return;
    completeOnboarding(name);
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <div className="page-enter flex flex-col gap-8">
        <Logo />
        <div>
          <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-fg text-balance">
            Time, directed.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted text-pretty">
            You sit at the center. Rounds send hours toward the threads of a life —
            craft, control, care.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-subtle text-pretty">
            No account, no cloud. Rounds, check-ins, and spans stay on this device and
            work offline.
          </p>
        </div>

        <div className="grid gap-2.5">
          {DEFAULT_SPANS.map((span) => (
            <div
              key={span.id}
              className="rounded-lg bg-surface px-4 py-3.5 shadow-border"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ background: TONE_VAR[span.tone] }}
                />
                <div>
                  <p className="text-sm font-medium text-fg">{span.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {activeThreads(span)
                      .map((t) => t.name)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">What should we call you?</span>
            <input
              type="text"
              autoComplete="nickname"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  begin();
                }
              }}
              suppressHydrationWarning
              className="min-h-11 rounded-md bg-surface px-3.5 text-base text-fg shadow-border outline-none placeholder:text-subtle focus:shadow-border-hover"
            />
          </label>
          <Button type="button" size="md" fullWidth onClick={begin} disabled={!ready}>
            Begin
          </Button>
        </div>
      </div>
    </main>
  );
}

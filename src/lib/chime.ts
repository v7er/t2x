let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export async function unlockChime(): Promise<void> {
  const ac = context();
  if (!ac) return;
  if (ac.state === "suspended") {
    try {
      await ac.resume();
    } catch {
      /* autoplay lock */
    }
  }
}

function partial(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq * 0.985), start + dur);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function strike(ac: AudioContext, at: number, scale = 1) {
  // Temple rin: bright strike, long bloom.
  partial(ac, 784.0, at, 1.8, 0.16 * scale);
  partial(ac, 1176.0, at, 1.2, 0.09 * scale);
  partial(ac, 1568.0, at, 0.7, 0.05 * scale);
  partial(ac, 523.25, at, 2.4, 0.11 * scale);
  partial(ac, 392.0, at, 2.6, 0.08 * scale);
  partial(ac, 2093.0, at, 0.22, 0.035 * scale, "triangle");
}

export async function playChime(kind: "focus" | "break" = "focus") {
  await unlockChime();
  const ac = context();
  if (!ac || ac.state !== "running") return;
  const t = ac.currentTime + 0.02;
  if (kind === "focus") {
    strike(ac, t, 1);
    strike(ac, t + 0.62, 0.72);
  } else {
    strike(ac, t, 0.7);
  }
  try {
    navigator.vibrate?.([90, 70, 90, 70, 180]);
  } catch {
    /* no haptic */
  }
}

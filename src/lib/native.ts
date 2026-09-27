export function isNativeDesktop(): boolean {
  return typeof window !== "undefined" && Boolean(window.t2xNative?.desktop);
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeDesktop()) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function installHint(): "ios" | "mac" | "desktop" | "installed" {
  if (isStandaloneApp()) return "installed";
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Mac/.test(ua)) return "mac";
  return "desktop";
}

declare global {
  interface Window {
    t2xNative?: {
      desktop: boolean;
      platform: string;
    };
  }
}

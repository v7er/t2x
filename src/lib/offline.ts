import { useEffect, useState } from "react";
import { isNativeDesktop } from "./native";

export function registerOfflineWorker() {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) return;
  if (import.meta.env.VITE_T2X_NATIVE === "1") return;
  if (isNativeDesktop()) return;
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

import { useEffect, useState } from "react";
import { useT2xStore } from "./store";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setHydrated(true);
    };

    if (useT2xStore.persist.hasHydrated()) {
      finish();
      return;
    }

    const unsub = useT2xStore.persist.onFinishHydration(finish);
    void Promise.resolve(useT2xStore.persist.rehydrate()).catch(() => {
      finish();
    });
    const timeout = window.setTimeout(finish, 1200);
    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, []);

  return hydrated;
}

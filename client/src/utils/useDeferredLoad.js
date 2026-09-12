import { useEffect } from "react";

export function useDeferredLoad(load) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);
}

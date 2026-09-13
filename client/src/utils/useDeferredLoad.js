import { useEffect } from "react";

export function useDeferredLoad(load) {
  useEffect(() => {
    load();
  }, [load]);
}

import { useCallback, useRef } from "react";

/**
 * Returns an onMouseEnter handler that eagerly imports a route module.
 * Only fires once per route to avoid redundant imports.
 */
export function usePrefetchRoute(importFn: () => Promise<unknown>) {
  const prefetched = useRef(false);

  const onMouseEnter = useCallback(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      importFn().catch(() => {
        // reset so it can retry on next hover
        prefetched.current = false;
      });
    }
  }, [importFn]);

  return onMouseEnter;
}

import { useCallback, useRef } from "react";

type ImportFn = () => Promise<unknown>;

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleCallback, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const prefetchedImports = new Set<ImportFn>();

export const prefetchImport = (importFn: ImportFn) => {
  if (prefetchedImports.has(importFn)) return Promise.resolve();

  prefetchedImports.add(importFn);
  return importFn().catch((error) => {
    prefetchedImports.delete(importFn);
    throw error;
  });
};

export const prefetchOnIdle = (imports: ImportFn[], timeout = 2500) => {
  if (typeof window === "undefined") return () => {};

  const idleWindow = window as IdleWindow;
  const run = () => {
    imports.forEach((importFn) => {
      void prefetchImport(importFn).catch(() => {});
    });
  };

  if (typeof idleWindow.requestIdleCallback === "function") {
    const idleId = idleWindow.requestIdleCallback(() => run(), { timeout });
    return () => idleWindow.cancelIdleCallback?.(idleId);
  }

  const timerId = window.setTimeout(run, 350);
  return () => window.clearTimeout(timerId);
};

/**
 * Returns an onMouseEnter handler that eagerly imports a route module.
 * Only fires once per route to avoid redundant imports.
 */
export function usePrefetchRoute(importFn: ImportFn) {
  const prefetched = useRef(false);

  const onMouseEnter = useCallback(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      void prefetchImport(importFn).catch(() => {
        prefetched.current = false;
      });
    }
  }, [importFn]);

  return onMouseEnter;
}

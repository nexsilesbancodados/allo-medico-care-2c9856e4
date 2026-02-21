import { useCallback, useRef, useState } from "react";

/**
 * Hook to prevent double-clicks / rapid submissions.
 * Returns [isLocked, lockAndRun] where lockAndRun wraps an async fn with a cooldown.
 *
 * @param cooldownMs Minimum ms between invocations (default 2000)
 */
export function useCooldown(cooldownMs = 2000) {
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const lockAndRun = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (locked) return undefined;
      setLocked(true);

      try {
        return await fn();
      } finally {
        timer.current = setTimeout(() => setLocked(false), cooldownMs);
      }
    },
    [locked, cooldownMs]
  );

  return [locked, lockAndRun] as const;
}

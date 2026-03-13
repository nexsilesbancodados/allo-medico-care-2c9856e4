const isDev = import.meta.env.DEV;

export const log = (...args: unknown[]) => { if (isDev) console.log(...args); };
export const warn = (...args: unknown[]) => { if (isDev) console.warn(...args); };

/**
 * Logs errors always (dev + prod). In production, could be wired to
 * Sentry / Datadog / any external service by replacing the console.error call.
 */
export const logError = (message: string, error?: unknown, context?: Record<string, unknown>) => {
  console.error(`[AloMédico] ${message}`, { error, context, ts: new Date().toISOString() });
  // TODO: wire to external monitoring (e.g. Sentry.captureException(error))
};

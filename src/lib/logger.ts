import { captureError } from "@/lib/sentry";

const isDev = import.meta.env.DEV;

export const log = (...args: unknown[]) => { if (isDev) console.log(...args); };
export const warn = (...args: unknown[]) => { if (isDev) console.warn(...args); };

/**
 * Production-ready error logger.
 * - In dev: logs to console with full context.
 * - In prod: sends to Sentry (when DSN is configured) AND logs to console.
 */
export const logError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
) => {
  const ts = new Date().toISOString();

  if (isDev) {
    console.error(`[AloMédico] ${message}`, { error, context, ts });
  } else {
    // Always log in prod so server-side tools (e.g. Cloudflare Workers) can capture
    console.error(`[AloMédico] ${message}`, ts, context ?? "");

    // Wire to Sentry when DSN is configured
    if (error instanceof Error) {
      captureError(error, { message, ts, ...context });
    } else if (error !== undefined && error !== null) {
      captureError(new Error(String(error)), { message, ts, ...context });
    }
  }
};

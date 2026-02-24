import * as Sentry from "@sentry/react";

// Set your Sentry DSN here or via VITE_SENTRY_DSN env variable
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.info("[Sentry] DSN não configurado. Crie uma conta em https://sentry.io e adicione VITE_SENTRY_DSN.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.3,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) return null;
      return event;
    },
  });

  console.info("[Sentry] Monitoramento ativo ✅");
};

/**
 * Capture a custom error with context for critical flows.
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (!SENTRY_DSN) {
    console.error("[Sentry offline]", error.message, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
};

/**
 * Track a custom event (e.g., payment failure, auth error).
 */
export const trackEvent = (name: string, data?: Record<string, unknown>) => {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(name, { level: "info", extra: data });
};

export { Sentry };

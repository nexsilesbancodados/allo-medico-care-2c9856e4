import * as Sentry from "@sentry/react";

// Replace with your actual Sentry DSN when ready
const SENTRY_DSN = "";

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.info("[Sentry] DSN não configurado. Monitoramento desabilitado.");
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
      // Filter out known non-critical errors
      if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) return null;
      return event;
    },
  });
};

export { Sentry };

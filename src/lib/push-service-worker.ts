export const PUSH_SW_URL = "/push-sw.js";
export const PUSH_SW_SCOPE = "/push/";

const getServiceWorkerScriptUrl = (registration: ServiceWorkerRegistration) => {
  return registration.active?.scriptURL
    ?? registration.waiting?.scriptURL
    ?? registration.installing?.scriptURL
    ?? "";
};

export const getRegisteredPushServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE);
};

export const ensurePushServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) return null;

  const existingRegistration = await getRegisteredPushServiceWorker();
  if (existingRegistration) return existingRegistration;

  return navigator.serviceWorker.register(PUSH_SW_URL, {
    scope: PUSH_SW_SCOPE,
  });
};

export const unregisterLegacyRootPushServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;

  const rootScope = new URL("/", window.location.origin).href;
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) => {
        const scriptUrl = getServiceWorkerScriptUrl(registration);
        return scriptUrl.includes(PUSH_SW_URL) && registration.scope === rootScope;
      })
      .map((registration) => registration.unregister()),
  );
};

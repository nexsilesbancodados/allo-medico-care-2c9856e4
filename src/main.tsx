import { createRoot } from "react-dom/client";
import "./index.css";

const CHUNK_RELOAD_PARAM = "__chunk_reloaded";
const CACHE_RESET_PARAM = "__cache_reset";

const CHUNK_ERROR_REGEX = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i;
const ASSET_JS_REGEX = /\/assets\/.*\.js(?:\?.*)?$/i;
const ASSET_CSS_REGEX = /\/assets\/.*\.css(?:\?.*)?$/i;

const getErrorMessage = (value: unknown) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
};

const isChunkLoadError = (value: unknown) => CHUNK_ERROR_REGEX.test(getErrorMessage(value));

const isChunkAssetElementError = (target: EventTarget | null) => {
  if (target instanceof HTMLScriptElement) {
    return target.type === "module" || ASSET_JS_REGEX.test(target.src);
  }

  if (target instanceof HTMLLinkElement) {
    if (target.rel === "modulepreload") return true;
    return target.rel === "stylesheet" && ASSET_CSS_REGEX.test(target.href);
  }

  return false;
};

const forceReloadWithParam = (param: string) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get(param) === "1") return false;
  url.searchParams.set(param, "1");
  window.location.replace(url.toString());
  return true;
};

const clearRecoveryParams = () => {
  const url = new URL(window.location.href);
  const hadChunkReload = url.searchParams.has(CHUNK_RELOAD_PARAM);
  const hadCacheReset = url.searchParams.has(CACHE_RESET_PARAM);

  if (!hadChunkReload && !hadCacheReset) return;

  url.searchParams.delete(CHUNK_RELOAD_PARAM);
  url.searchParams.delete(CACHE_RESET_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

const clearClientCaches = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }
};

const resetCachesAndReload = async () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get(CACHE_RESET_PARAM) === "1") return false;

  try {
    await clearClientCaches();
  } catch (error) {
    console.warn("[main] Cache reset falhou:", error);
  }

  url.searchParams.set(CACHE_RESET_PARAM, "1");
  window.location.replace(url.toString());
  return true;
};

const renderRecoveryFallback = () => {
  const root = document.getElementById("root");
  if (!root || root.innerHTML.trim().length > 0) return;

  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center;max-width:420px;padding:0 16px"><h2>Falha ao carregar recursos</h2><p>Limpe o cache do navegador e recarregue.</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Recarregar</button></div></div>';
};

const recoverFromChunkError = () => {
  const didReload = forceReloadWithParam(CHUNK_RELOAD_PARAM);
  if (didReload) return;

  void resetCachesAndReload().then((didReset) => {
    if (!didReset) renderRecoveryFallback();
  });
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromChunkError();
});

window.addEventListener(
  "error",
  (event) => {
    const errorEvent = event as ErrorEvent;
    const hasChunkMessage = isChunkLoadError(errorEvent.error ?? errorEvent.message);
    const hasChunkAssetFailure = isChunkAssetElementError(event.target as EventTarget | null);

    if (hasChunkMessage || hasChunkAssetFailure) recoverFromChunkError();
  },
  true
);

window.addEventListener("unhandledrejection", (event) => {
  if (!isChunkLoadError(event.reason)) return;
  event.preventDefault();
  recoverFromChunkError();
});

console.log("[main] Starting app...");

try {
  import("./lib/sentry")
    .then(({ initSentry }) => {
      initSentry();
      console.log("[main] Sentry initialized");
    })
    .catch((e) => console.warn("[main] Sentry init skipped:", e));
} catch (e) {
  console.warn("[main] Sentry import failed:", e);
}

try {
  import("./lib/supabase-helpers")
    .then(({ initNetworkListeners }) => {
      initNetworkListeners();
    })
    .catch(() => {});
} catch {}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/push-sw.js").catch((err) => {
    console.warn("Push SW registration failed:", err);
  });
}

const root = document.getElementById("root")!;

const renderFatalFallback = () => {
  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h2>Erro ao carregar</h2><p>Tente recarregar a página.</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Recarregar</button></div></div>';
};

const bootstrap = async () => {
  try {
    console.log("[main] Mounting React...");
    const { default: App } = await import("./App");
    createRoot(root).render(<App />);
    clearRecoveryParams();
    console.log("[main] React mounted");
  } catch (error) {
    console.error("Fatal render/bootstrap error:", error);

    if (isChunkLoadError(error)) {
      recoverFromChunkError();
      return;
    }

    renderFatalFallback();
  }
};

void bootstrap();

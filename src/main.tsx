import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const CHUNK_RELOAD_PARAM = "__chunk_reloaded";

const forceChunkRecoveryReload = () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get(CHUNK_RELOAD_PARAM) === "1") return;
  url.searchParams.set(CHUNK_RELOAD_PARAM, "1");
  window.location.replace(url.toString());
};

const clearChunkReloadParam = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(CHUNK_RELOAD_PARAM)) return;
  url.searchParams.delete(CHUNK_RELOAD_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  forceChunkRecoveryReload();
});

window.addEventListener("error", (event) => {
  const message = String((event as ErrorEvent).error?.message ?? event.message ?? "");
  if (/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
    forceChunkRecoveryReload();
  }
});

console.log("[main] Starting app...");

// Initialize Sentry lazily — don't block render if it fails
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

// Global network status toasts (lazy)
try {
  import("./lib/supabase-helpers")
    .then(({ initNetworkListeners }) => {
      initNetworkListeners();
    })
    .catch(() => {});
} catch {}

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/push-sw.js").catch((err) => {
    console.warn("Push SW registration failed:", err);
  });
}

const root = document.getElementById("root")!;

try {
  console.log("[main] Mounting React...");
  createRoot(root).render(<App />);
  clearChunkReloadParam();
  console.log("[main] React mounted");
} catch (err) {
  console.error("Fatal render error:", err);
  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h2>Erro ao carregar</h2><p>Tente recarregar a página.</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Recarregar</button></div></div>';
}

import { logError } from "@/lib/logger";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/* ── Chunk-error recovery ─────────────────────────────── */
const CHUNK_RELOAD_KEY = "__chunk_reloaded";
const CHUNK_RE = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i;

const isChunkError = (v: unknown) => {
  const msg = v instanceof Error ? v.message : typeof v === "string" ? v : "";
  return CHUNK_RE.test(msg);
};

const recover = () => {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return; // already tried once
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");

  // clear caches then reload
  const reset = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };
  void reset();
};

window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recover(); });
window.addEventListener("unhandledrejection", (e) => { if (isChunkError(e.reason)) { e.preventDefault(); recover(); } });
window.addEventListener("error", (e) => {
  if (isChunkError((e as ErrorEvent).error ?? (e as ErrorEvent).message)) recover();
}, true);

/* ── Lazy side-effects (non-blocking) ─────────────────── */
import("./lib/sentry").then(({ initSentry }) => initSentry()).catch(() => {});
import("./lib/supabase-helpers").then(({ initNetworkListeners }) => initNetworkListeners()).catch(() => {});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/push-sw.js").catch(() => {});
}

/* ── Mount React synchronously ────────────────────────── */
const root = document.getElementById("root")!;

try {
  createRoot(root).render(<App />);
} catch (err) {
  logError("Fatal React mount error", err);
  if (isChunkError(err)) { recover(); }
  else {
    root.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h2>Erro ao carregar</h2><p>Tente recarregar a página.</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Recarregar</button></div></div>';
  }
}

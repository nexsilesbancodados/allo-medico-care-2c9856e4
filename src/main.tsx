import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { unregisterLegacyRootPushServiceWorkers } from "@/lib/push-service-worker";

/* ── Chunk-error recovery ─────────────────────────────── */
const CHUNK_RELOAD_KEY = "__chunk_reloaded";
const CHUNK_RE = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i;

const isChunkError = (v: unknown) => {
  const msg = v instanceof Error ? v.message : typeof v === "string" ? v : "";
  return CHUNK_RE.test(msg);
};

const getReloadFlag = () => {
  try { return sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1"; } catch { return false; }
};
const setReloadFlag = () => {
  try { sessionStorage.setItem(CHUNK_RELOAD_KEY, "1"); } catch {}
};
const clearReloadFlag = () => {
  try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
};

const recover = () => {
  if (getReloadFlag()) { clearReloadFlag(); return; }
  setReloadFlag();
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
window.addEventListener("unhandledrejection", (e) => {
  if (isChunkError(e.reason)) { e.preventDefault(); recover(); }
});
window.addEventListener("error", (e) => {
  if (isChunkError((e as ErrorEvent).error ?? (e as ErrorEvent).message)) recover();
}, true);

/* ── Lazy side-effects (non-blocking) ─────────────────── */
import("./lib/sentry").then(({ initSentry }) => initSentry()).catch(() => {});
// Network listeners removed - not exported from supabase-helpers

const isPreviewEnvironment = window.location.hostname.startsWith("id-preview--");

if ("serviceWorker" in navigator) {
  if (isPreviewEnvironment) {
    void navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister()))).catch(() => {});
    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
    }
  } else {
    void unregisterLegacyRootPushServiceWorkers().catch(() => {});
  }
}

/* ── Mount ──────────────────────────────────────────────── */
const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const mountApp = async () => {
  try {
    const [{ default: App }, { default: ErrorBoundary }] = await Promise.all([
      import("./App"),
      import("./components/ErrorBoundary"),
    ]);
    createRoot(root).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
    clearReloadFlag();
  } catch (err) {
    if (isChunkError(err)) { recover(); return; }
    console.error("[boot] Fatal mount error", err);
    root.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h2>Erro ao carregar</h2><p>Recarregue a página.</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc">Recarregar</button></div></div>';
  }
};

void mountApp();

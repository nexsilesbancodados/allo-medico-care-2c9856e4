import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { initNetworkListeners } from "./lib/supabase-helpers";

// Initialize Sentry error monitoring
initSentry();

// Global network status toasts
initNetworkListeners();

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/push-sw.js").catch((err) => {
    console.warn("Push SW registration failed:", err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);

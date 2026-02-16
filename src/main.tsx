import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/push-sw.js").catch((err) => {
    console.warn("Push SW registration failed:", err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);

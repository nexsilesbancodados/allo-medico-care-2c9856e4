import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts beyond ⌘K (handled by GlobalCommand).
 * - Escape: close any open modal (relies on native dialog behavior)
 * - Alt+H: go home
 * - Alt+D: go to dashboard
 * - Alt+?: show shortcuts help toast
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.altKey && e.key === "h") {
        e.preventDefault();
        navigate("/");
      }

      if (e.altKey && e.key === "d") {
        e.preventDefault();
        navigate("/dashboard");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}

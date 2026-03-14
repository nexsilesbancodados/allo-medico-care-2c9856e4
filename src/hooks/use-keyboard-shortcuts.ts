import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Alt + H",   description: "Ir para a Página Inicial" },
  { keys: "Alt + D",   description: "Ir para o Painel" },
  { keys: "Alt + N",   description: "Nova consulta / Agendar" },
  { keys: "Alt + P",   description: "Meu Perfil" },
  { keys: "⌘K / Ctrl+K", description: "Busca rápida" },
  { keys: "?",         description: "Mostrar atalhos de teclado" },
];

const isInputActive = () => {
  const tag = (document.activeElement as HTMLElement)?.tagName;
  const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditable;
};

/**
 * Global keyboard shortcuts — registers window-level handlers.
 * Skip if focus is in an input/textarea/select/contenteditable.
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const showHelp = useCallback(() => {
    const lines = SHORTCUTS.map(s => `${s.keys} → ${s.description}`).join("  ·  ");
    toast.info("⌨️ Atalhos de Teclado", {
      description: lines,
      duration: 6000,
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputActive()) return;

      // Alt shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            navigate("/");
            break;
          case "d":
            e.preventDefault();
            navigate("/dashboard");
            break;
          case "n":
            e.preventDefault();
            navigate("/dashboard/schedule");
            break;
          case "p":
            e.preventDefault();
            navigate("/dashboard/profile");
            break;
        }
        return;
      }

      // ? — show shortcuts help (no modifier key)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showHelp();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, showHelp]);
}

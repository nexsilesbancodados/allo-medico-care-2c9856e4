import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const groups: ShortcutGroup[] = [
  {
    title: "Navegação",
    shortcuts: [
      { keys: ["⌘", "K"], label: "Busca global" },
      { keys: ["G", "D"], label: "Ir para Dashboard" },
      { keys: ["G", "P"], label: "Ir para Perfil" },
      { keys: ["N"], label: "Nova ação primária" },
    ],
  },
  {
    title: "Geral",
    shortcuts: [
      { keys: ["?"], label: "Abrir atalhos" },
      { keys: ["ESC"], label: "Fechar modal" },
    ],
  },
];

export function DashboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Atalhos de teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{g.title}</p>
              <div className="space-y-1.5">
                {g.shortcuts.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border/50 min-w-[24px] text-center">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export the existing component for backwards compatibility
export { DashboardShortcuts } from "@/components/dashboards/DashboardShortcuts";

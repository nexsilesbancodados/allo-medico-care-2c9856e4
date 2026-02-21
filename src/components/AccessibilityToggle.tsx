import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Eye, Type, Users } from "lucide-react";

const AccessibilityToggle = () => {
  const [accessibilityMode, setAccessibilityMode] = useState(() =>
    localStorage.getItem("accessibility-mode") === "true"
  );
  const [highContrast, setHighContrast] = useState(() =>
    localStorage.getItem("high-contrast") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("accessibility-mode", accessibilityMode);
    localStorage.setItem("accessibility-mode", String(accessibilityMode));
  }, [accessibilityMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("high-contrast", String(highContrast));
  }, [highContrast]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-50 rounded-full w-12 h-12 shadow-elevated border-border bg-card"
          aria-label="Acessibilidade"
        >
          <Users className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Acessibilidade
          </h3>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Botões Grandes</p>
                <p className="text-xs text-muted-foreground">Fonte e alvos maiores</p>
              </div>
            </div>
            <Switch checked={accessibilityMode} onCheckedChange={setAccessibilityMode} />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Alto Contraste</p>
                <p className="text-xs text-muted-foreground">Cores mais fortes</p>
              </div>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityToggle;

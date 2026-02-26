import { useState, useEffect, forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const CURRENT_TERMS_VERSION_KEY = "terms_version";

const TermsReconsentDialog = forwardRef<HTMLDivElement>((_, _ref) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    checkConsent();
  }, [user]);

  const checkConsent = async () => {
    // Get required version from app_settings
    const { data: setting } = await supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", CURRENT_TERMS_VERSION_KEY)
      .single();

    const version = (setting as any)?.value || "1.0.0";
    setRequiredVersion(version);

    // Check if user already accepted this version
    const { data: consent } = await supabase
      .from("user_consents")
      .select("id")
      .eq("user_id", user!.id)
      .eq("version", version)
      .eq("consent_type", "terms_of_use")
      .maybeSingle();

    if (!consent) {
      setOpen(true);
    }
  };

  const handleAccept = async () => {
    if (!accepted || !user || !requiredVersion) return;
    setSaving(true);

    await supabase.from("user_consents").insert({
      user_id: user.id,
      consent_type: "terms_of_use",
      version: requiredVersion,
      ip_address: null,
      user_agent: navigator.userAgent,
    });

    toast.success("Termos aceitos com sucesso!");
    setOpen(false);
    setSaving(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Atualização dos Termos de Uso
          </DialogTitle>
          <DialogDescription>
            Nossos Termos de Uso foram atualizados (versão {requiredVersion}). Para continuar usando a plataforma, você precisa aceitar os novos termos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>Principais alterações:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>Atualização da política de privacidade conforme LGPD</li>
              <li>Novos termos para teleconsulta e prescrição digital</li>
              <li>Política de reembolso e cancelamento revisada</li>
            </ul>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(!!v)}
            />
            <label htmlFor="accept-terms" className="text-sm cursor-pointer">
              Li e aceito os{" "}
              <a href="/terms" target="_blank" className="text-primary underline">Termos de Uso</a>{" "}
              e a{" "}
              <a href="/privacy" target="_blank" className="text-primary underline">Política de Privacidade</a>{" "}
              atualizados.
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!accepted || saving}
            className="w-full"
          >
            {saving ? "Salvando..." : "Aceitar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

TermsReconsentDialog.displayName = "TermsReconsentDialog";
export default TermsReconsentDialog;

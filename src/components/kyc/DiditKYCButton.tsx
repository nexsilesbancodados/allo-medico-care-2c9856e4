import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiditKYCButtonProps {
  onSessionCreated?: (url: string) => void;
  onComplete?: () => void;
  variant?: "full" | "compact" | "inline";
  className?: string;
}

const DiditKYCButton = ({ onSessionCreated, onComplete, variant = "full", className = "" }: DiditKYCButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  const startVerification = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      const callbackUrl = `${window.location.origin}/dashboard/profile?role=patient&kyc=complete`;

      const { data, error } = await supabase.functions.invoke("didit-kyc", {
        body: { callback: callbackUrl },
      });

      if (error) throw error;
      if (!data?.verification_url) throw new Error("No verification URL returned");

      setSessionUrl(data.verification_url);
      onSessionCreated?.(data.verification_url);

      // Open in new tab for best camera experience
      window.open(data.verification_url, "_blank", "noopener,noreferrer");
      
      toast.success("Verificação iniciada!", {
        description: "Complete o processo na nova aba. Ao finalizar, volte aqui.",
      });
    } catch (err: any) {
      console.error("[DiditKYC] Error:", err);
      toast.error("Erro ao iniciar verificação", {
        description: err.message || "Tente novamente.",
      });
    }
    setLoading(false);
  };

  if (variant === "compact") {
    return (
      <Button
        onClick={startVerification}
        disabled={loading}
        className={`rounded-xl gap-2 ${className}`}
        size="sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {loading ? "Iniciando..." : "Verificar Identidade"}
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={startVerification}
        disabled={loading}
        className={`flex items-center gap-2 text-sm text-primary font-semibold hover:underline transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
        {loading ? "Iniciando..." : "Verificar agora"}
      </button>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Verificação de Identidade</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Verificação segura com IA — tire uma foto do seu documento e uma selfie em poucos segundos.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 p-4 bg-card space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">1</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Documento com foto</p>
            <p className="text-xs text-muted-foreground">RG, CNH ou passaporte</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">2</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Selfie ao vivo</p>
            <p className="text-xs text-muted-foreground">Detecção de vivacidade com IA</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Verificação automática</p>
            <p className="text-xs text-muted-foreground">Resultado em segundos</p>
          </div>
        </div>
      </div>

      <Button
        onClick={startVerification}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Iniciando verificação...</>
        ) : (
          <><ShieldCheck className="w-5 h-5" /> Iniciar Verificação</>
        )}
      </Button>

      {sessionUrl && (
        <div className="rounded-xl bg-muted/50 p-3 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Verificação aberta em nova aba. Finalize o processo lá.
          </p>
          <a
            href={sessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Abrir novamente
          </a>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        🔒 Verificação segura via Didit. Seus dados são protegidos por criptografia e conformidade com LGPD/GDPR.
      </p>
    </div>
  );
};

export default DiditKYCButton;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MFAChallengeProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const MFAChallenge = ({ onSuccess, onCancel }: MFAChallengeProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find(f => f.status === "verified");
      if (!totp) throw new Error("Nenhum fator MFA encontrado");

      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyErr) throw verifyErr;

      onSuccess();
    } catch (err: any) {
      toast({ title: "Código inválido", description: "Verifique o código no seu app autenticador.", variant: "destructive" });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-foreground">Verificação em duas etapas</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu app autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={handleVerify} className="w-full" size="lg" disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Verificar
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

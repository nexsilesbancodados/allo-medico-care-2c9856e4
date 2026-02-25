import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, Copy, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export const MFASetup = () => {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const checkMFAStatus = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp?.find(f => f.status === "verified");
    if (totp) {
      setEnrolled(true);
      setFactorId(totp.id);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "AloClinica Authenticator",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      toast({ title: "Erro ao configurar MFA", description: err.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      setEnrolled(true);
      setQrCode("");
      setSecret("");
      toast({ title: "MFA ativado! 🔒", description: "Sua conta agora tem autenticação em duas etapas." });
    } catch (err: any) {
      toast({ title: "Código inválido", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setVerifyCode("");
    }
  };

  const handleUnenroll = async () => {
    if (!factorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setEnrolled(false);
      setFactorId(null);
      toast({ title: "MFA desativado", description: "Autenticação em duas etapas foi removida." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {enrolled ? <ShieldCheck className="w-5 h-5 text-success" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
          Autenticação em Duas Etapas (2FA)
        </CardTitle>
        <CardDescription>
          {enrolled
            ? "Sua conta está protegida com autenticação TOTP."
            : "Adicione uma camada extra de segurança com um app autenticador."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrolled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-success font-medium">MFA Ativo</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 className="w-3 h-3" /> Desativar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Desativar MFA?
                  </DialogTitle>
                  <DialogDescription>
                    Isso removerá a autenticação em duas etapas da sua conta, tornando-a menos segura.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end mt-4">
                  <Button variant="destructive" onClick={handleUnenroll} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar desativação"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">1. Escaneie o QR Code</p>
              <p>Use Google Authenticator, Authy ou outro app compatível.</p>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ou copie o código manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{secret}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    toast({ title: "Copiado!" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-2">2. Digite o código de 6 dígitos</p>
              <div className="flex gap-2">
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button onClick={handleEnroll} disabled={enrolling} className="gap-2">
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Configurar 2FA
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

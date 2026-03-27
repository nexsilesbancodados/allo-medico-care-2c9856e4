import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { validarLaudoPublico } from "@/lib/services/laudos-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Search } from "lucide-react";

interface LaudoInfo {
  qr_token: string;
  status: string;
  assinado_em: string | null;
  tipo_exame: string;
  medico_nome: string;
  paciente_nome: string;
}

export default function ValidarLaudo() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [inputToken, setInputToken] = useState(token ?? searchParams.get("t") ?? "");
  const [result, setResult] = useState<LaudoInfo | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const buscar = async (t: string) => {
    if (!t.trim()) return;
    setLoading(true);
    try {
      const r = await validarLaudoPublico(t.trim());
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) buscar(token);
  }, [token]);

  const isValid = result && result.status === "assinado";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Validação de Laudo Médico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token && (
            <div className="flex gap-2">
              <Input
                placeholder="Informe o código do laudo"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar(inputToken)}
              />
              <Button size="icon" onClick={() => buscar(inputToken)} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}

          {loading && <Skeleton className="h-32 w-full rounded-lg" />}

          {result === null && !loading && (
            <div className="text-center py-6 space-y-2">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-semibold text-destructive">Laudo não encontrado</p>
              <p className="text-sm text-muted-foreground">Verifique o código e tente novamente.</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              <div className="flex justify-center">
                {isValid ? (
                  <CheckCircle className="h-14 w-14 text-primary" />
                ) : (
                  <XCircle className="h-14 w-14 text-destructive" />
                )}
              </div>

              <p className="text-center font-semibold text-lg">
                {isValid ? "Laudo Válido ✓" : `Status: ${result.status}`}
              </p>

              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exame:</span>
                  <span className="font-medium">{result.tipo_exame}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Médico:</span>
                  <span className="font-medium">{result.medico_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente:</span>
                  <span className="font-medium">{result.paciente_nome}</span>
                </div>
                {result.assinado_em && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assinado em:</span>
                    <span className="font-medium">
                      {new Date(result.assinado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={isValid ? "default" : "secondary"}>{result.status}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

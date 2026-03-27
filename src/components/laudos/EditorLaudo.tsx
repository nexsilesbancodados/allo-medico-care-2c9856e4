import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchExamePorId,
  fetchLaudoPorExame,
  criarLaudo,
  salvarLaudo,
  assinarLaudo,
  buildOhifUrl,
  type AlocExame,
  type AlocLaudo,
} from "@/lib/services/laudos-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";

export default function EditorLaudo() {
  const { exameId } = useParams<{ exameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exame, setExame] = useState<AlocExame | null>(null);
  const [laudo, setLaudo] = useState<AlocLaudo | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!exameId || !user) return;
    (async () => {
      try {
        const e = await fetchExamePorId(exameId);
        if (!e) { toast.error("Exame não encontrado"); navigate("/laudos/fila"); return; }
        setExame(e);

        let l = await fetchLaudoPorExame(exameId);
        if (!l) l = await criarLaudo(exameId, user.id);
        setLaudo(l);
        setHtml(l.conteudo_html);
      } catch {
        toast.error("Erro ao carregar exame");
      } finally {
        setLoading(false);
      }
    })();
  }, [exameId, user, navigate]);

  const handleSave = useCallback(async () => {
    if (!laudo) return;
    setSaving(true);
    try {
      await salvarLaudo(laudo.id, html);
      toast.success("Laudo salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [laudo, html]);

  const handleSign = useCallback(async () => {
    if (!laudo || !exame) return;
    if (!html.trim()) { toast.error("O laudo não pode estar vazio"); return; }
    setSigning(true);
    try {
      await salvarLaudo(laudo.id, html);
      await assinarLaudo(laudo.id, exame.id);
      toast.success("Laudo assinado com sucesso!");
      navigate("/laudos/fila");
    } catch {
      toast.error("Erro ao assinar");
    } finally {
      setSigning(false);
    }
  }, [laudo, exame, html, navigate]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!exame || !laudo) return null;

  const isReadOnly = laudo.status === "assinado" || laudo.status === "entregue";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/laudos/fila")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Laudo — {exame.tipo_exame}
          </h1>
          <Badge variant={isReadOnly ? "default" : "secondary"}>
            {laudo.status}
          </Badge>
        </div>
        {exame.orthanc_study_uid && (
          <a
            href={buildOhifUrl(exame.orthanc_study_uid)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Abrir no OHIF Viewer
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OHIF Viewer iframe */}
        {exame.orthanc_study_uid && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm">Imagens DICOM</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={buildOhifUrl(exame.orthanc_study_uid)}
                className="w-full h-[500px] border-0"
                title="OHIF Viewer"
                allow="fullscreen"
              />
            </CardContent>
          </Card>
        )}

        {/* Editor */}
        <Card className={exame.orthanc_study_uid ? "" : "lg:col-span-2"}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Conteúdo do Laudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Digite o conteúdo do laudo aqui..."
              className="min-h-[400px] font-mono text-sm"
              disabled={isReadOnly}
            />

            {!isReadOnly && (
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Salvando…" : "Salvar Rascunho"}
                </Button>
                <Button onClick={handleSign} disabled={signing}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {signing ? "Assinando…" : "Assinar Laudo"}
                </Button>
              </div>
            )}

            {isReadOnly && laudo.qr_token && (
              <p className="text-xs text-muted-foreground">
                QR Token de validação: <code className="bg-muted px-1 rounded">{laudo.qr_token}</code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

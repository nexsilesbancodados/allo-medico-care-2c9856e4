import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchExamesParaLaudar, assumirExame, type AlocExame } from "@/lib/services/laudos-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  aguardando: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  em_laudo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function FilaLaudos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exames, setExames] = useState<AlocExame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamesParaLaudar()
      .then(setExames)
      .catch(() => toast.error("Erro ao carregar fila"))
      .finally(() => setLoading(false));
  }, []);

  const handleAssumir = async (exame: AlocExame) => {
    if (!user) return;
    try {
      await assumirExame(exame.id, user.id);
      navigate(`/laudos/editor/${exame.id}`);
    } catch {
      toast.error("Erro ao assumir exame");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Fila de Laudos
      </h1>

      {exames.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum exame aguardando laudo.
          </CardContent>
        </Card>
      )}

      {exames.map((exame) => (
        <Card key={exame.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">{exame.tipo_exame}</CardTitle>
            <Badge className={statusColors[exame.status] ?? ""}>{exame.status}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ID: {exame.id.slice(0, 8)}…</p>
              <p>Criado: {new Date(exame.created_at).toLocaleDateString("pt-BR")}</p>
              {exame.orthanc_study_uid && (
                <p className="text-xs">Study UID: {exame.orthanc_study_uid.slice(0, 20)}…</p>
              )}
            </div>
            <div className="flex gap-2">
              {exame.status === "aguardando" && (
                <Button size="sm" onClick={() => handleAssumir(exame)}>
                  Assumir Laudo
                </Button>
              )}
              {exame.status === "em_laudo" && exame.laudista_id === user?.id && (
                <Button size="sm" onClick={() => navigate(`/laudos/editor/${exame.id}`)}>
                  <Eye className="h-4 w-4 mr-1" /> Continuar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

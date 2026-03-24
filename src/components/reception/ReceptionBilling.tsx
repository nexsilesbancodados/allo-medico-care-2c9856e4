import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Plus, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ReceptionBilling = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ patient_name: "", insurance: "", guide_type: "TISS", description: "" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    // Use patient_documents table for billing docs with a "billing" description pattern
    const { data } = await supabase.from("patient_documents")
      .select("id, file_name, file_url, file_type, file_size, description, created_at, patient_id, uploaded_by")
      .ilike("description", "%TISS%,%TUSS%,%guia%,%convênio%,%convenio%,%billing%")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const patientIds = [...new Set(data.map(d => d.patient_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
      setDocuments(data.map(d => ({ ...d, patient_name: pMap.get(d.patient_id) ?? "—" })));
    } else {
      setDocuments([]);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB).");
      return;
    }
    setUploading(true);

    const filePath = `billing/${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const desc = `[${form.guide_type}] ${form.insurance ? form.insurance + " - " : ""}${form.description || "Guia de convênio"} - ${form.patient_name}`;

    await supabase.from("patient_documents").insert({
      patient_id: user.id, // stored as uploader reference
      uploaded_by: user.id,
      file_name: file.name,
      file_url: filePath,
      file_type: file.type,
      file_size: file.size,
      description: desc,
    });

    toast.success("Guia enviada com sucesso!");
    setShowUpload(false);
    setFile(null);
    setForm({ patient_name: "", insurance: "", guide_type: "TISS", description: "" });
    setUploading(false);
    fetchDocuments();
  };

  const viewFile = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Erro ao gerar link.");
  };

  const filtered = documents.filter(d =>
    `${d.file_name} ${d.description} ${d.patient_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("billing")}>
      <div className="max-w-4xl pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Faturamento de Convênios</h1>
            <p className="text-muted-foreground text-sm">Guias TISS/TUSS e documentos de planos de saúde</p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Guia
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar guia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? <div className="shimmer-v2 h-20 rounded-2xl"/> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground truncate max-w-[150px]">{d.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{d.description}</TableCell>
                    <TableCell className="text-sm text-foreground">{d.patient_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => viewFile(d.file_url)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma guia encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enviar Guia de Convênio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de Guia</label>
              <Select value={form.guide_type} onValueChange={v => setForm(f => ({ ...f, guide_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TISS">TISS</SelectItem>
                  <SelectItem value="TUSS">TUSS</SelectItem>
                  <SelectItem value="Guia SP/SADT">Guia SP/SADT</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Paciente</label>
              <Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Convênio</label>
              <Input value={form.insurance} onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))} placeholder="Unimed, Amil, etc." />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Observações</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes adicionais" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arquivo (PDF ou imagem, máx 10MB)</label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "Enviando..." : "Enviar Guia"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReceptionBilling;

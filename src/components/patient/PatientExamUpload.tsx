import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Eye, Plus, Search, FolderLock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useEffect } from "react";

const PatientExamUpload = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("exam");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { if (user) fetchDocuments(); }, [user]);

  const fetchDocuments = async () => {
    const { data } = await supabase.from("patient_documents")
      .select("*")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "O tamanho máximo é 10MB." });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload", { description: uploadError.message });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("patient-documents").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("patient_documents").insert({
      patient_id: user.id,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: filePath,
      file_type: file.type,
      file_size: file.size,
      description: description || file.name,
      category,
    });

    if (dbError) {
      toast.error("Erro ao salvar", { description: dbError.message });
    } else {
      toast.success("Documento enviado! ✅");
      setDescription("");
      setCategory("exam");
      fetchDocuments();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const viewDocument = async (doc: { file_url: string }) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(doc.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Erro ao abrir documento");
  };

  const deleteDocument = async (doc: { id: string; file_url: string }) => {
    await supabase.storage.from("patient-documents").remove([doc.file_url]);
    await supabase.from("patient_documents").delete().eq("id", doc.id);
    toast.success("Documento removido");
    fetchDocuments();
  };

  const fileIcon = (type: string) => {
    if (type?.includes("image")) return "🖼️";
    if (type?.includes("pdf")) return "📄";
    return "📎";
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "exam": return "🔬";
      case "prescription": return "💊";
      case "certificate": return "📋";
      case "history": return "📁";
      default: return "📎";
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "exam": return "Exame";
      case "prescription": return "Receita";
      case "certificate": return "Atestado";
      case "history": return "Histórico";
      default: return "Outro";
    }
  };

  const filteredDocs = documents.filter(d => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (searchQuery && !(d.description || d.file_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("documents")}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2"><FolderLock className="w-6 h-6" /> Cofre de Documentos</h1>
        <p className="text-muted-foreground text-sm mb-6">Guarde exames, receitas e documentos médicos com segurança</p>

        {/* Upload area */}
        <Card className="border-border border-dashed mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Enviar novo documento</p>
              <p className="text-xs text-muted-foreground mb-4">PDF, imagens (JPG, PNG) — máx. 10MB</p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Input
                  placeholder="Descrição (ex: Hemograma completo)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">🔬 Exame</SelectItem>
                    <SelectItem value="prescription">💊 Receita</SelectItem>
                    <SelectItem value="certificate">📋 Atestado</SelectItem>
                    <SelectItem value="history">📁 Histórico</SelectItem>
                    <SelectItem value="other">📎 Outro</SelectItem>
                  </SelectContent>
                </Select>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
                <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-gradient-hero text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" /> {uploading ? "Enviando..." : "Escolher Arquivo"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents list */}
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar documentos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({documents.length})</SelectItem>
              <SelectItem value="exam">🔬 Exames</SelectItem>
              <SelectItem value="prescription">💊 Receitas</SelectItem>
              <SelectItem value="certificate">📋 Atestados</SelectItem>
              <SelectItem value="history">📁 Histórico</SelectItem>
              <SelectItem value="other">📎 Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredDocs.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryIcon(d.category || "exam")}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.description || d.file_name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{d.file_name}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{categoryLabel(d.category || "exam")}</Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatSize(d.file_size || 0)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => viewDocument(d)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDocument(d)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                      Nenhum exame enviado ainda. Envie seus exames acima.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientExamUpload;

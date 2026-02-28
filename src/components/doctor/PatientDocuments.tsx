import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Search, Eye, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PatientDocuments = () => {
  const { user } = useAuth();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPatient, setFilterPatient] = useState("all");

  useEffect(() => { if (user) fetchDocuments(); }, [user]);

  const fetchDocuments = async () => {
    const { data: doc } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!doc) { setLoading(false); return; }

    // Get all patients this doctor has appointments with
    const { data: appts } = await supabase.from("appointments")
      .select("patient_id")
      .eq("doctor_id", doc.id);

    const patientIds = [...new Set((appts ?? []).filter(a => a.patient_id).map(a => a.patient_id))];
    if (patientIds.length === 0) { setLoading(false); return; }

    // Get patient profiles
    const { data: profiles } = await supabase.from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", patientIds);
    
    setPatients(profiles ?? []);

    // Get documents for these patients
    const { data: docs } = await supabase.from("patient_documents")
      .select("*")
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (docs) {
      const pMap = new Map((profiles ?? []).map(p => [p.user_id, `${p.first_name} ${p.last_name}`]));
      setDocuments(docs.map(d => ({
        ...d,
        patient_name: pMap.get(d.patient_id) ?? "Paciente",
      })));
    }
    setLoading(false);
  };

  const viewDocument = async (doc: any) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(
      `${doc.patient_id}/${doc.file_name}`, 3600
    );
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Erro ao abrir documento");
    }
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchPatient = filterPatient === "all" || d.patient_id === filterPatient;
    return matchSearch && matchPatient;
  });

  const fileIcon = (type: string) => {
    if (type?.includes("image")) return "🖼️";
    if (type?.includes("pdf")) return "📄";
    return "📎";
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("documents")}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Exames e Documentos</h1>
        <p className="text-muted-foreground text-sm mb-4">Documentos enviados pelos pacientes</p>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterPatient} onValueChange={setFilterPatient}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Todos pacientes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos pacientes</SelectItem>
              {patients.map(p => (
                <SelectItem key={p.user_id} value={p.user_id}>{p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{fileIcon(d.file_type)}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.description || d.file_name}</p>
                          <p className="text-xs text-muted-foreground">{d.file_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{d.file_type?.split("/")[1] ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => viewDocument(d)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                      Nenhum documento encontrado.
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

export default PatientDocuments;

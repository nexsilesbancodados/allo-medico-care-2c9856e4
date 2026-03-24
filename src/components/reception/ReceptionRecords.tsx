import { useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, FileText, Eye, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ReceptionRecords = () => {
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["reception-records", search],
    queryFn: async () => {
      let query = supabase
        .from("medical_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const typeLabels: Record<string, string> = {
    condition: "Condição",
    allergy: "Alergia",
    medication: "Medicação",
    procedure: "Procedimento",
    diagnosis: "Diagnóstico",
    note: "Observação",
  };

  return (
    <DashboardLayout title="Prontuários" nav={getReceptionNav("records")} role="receptionist">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tabular-nums">Prontuários Médicos</h2>
            <p className="text-muted-foreground text-sm">Consulta e organização de prontuários dos pacientes</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            {records.length} registros
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Registros Médicos</CardTitle>
              <div className="relative w-full sm:w-72 pb-24 md:pb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando prontuários...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhum prontuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>CID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r: { id: string; patient_id?: string; title: string; record_type: string; cid_code?: string | null; is_active: boolean; created_at: string }) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {r.patient_id?.slice(0, 8) || "—"}
                          </span>
                        </TableCell>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[r.record_type] || r.record_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.cid_code || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={r.is_active ? "default" : "secondary"}>
                            {r.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionRecords;

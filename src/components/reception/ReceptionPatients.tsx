import { useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Phone, Mail, Calendar, FileText, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ReceptionPatients = () => {
  const [search, setSearch] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["reception-patients", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,cpf.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <DashboardLayout title="Pacientes" nav={getReceptionNav("patients")} role="receptionist">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cadastro de Pacientes</h2>
            <p className="text-muted-foreground text-sm">Gerencie os dados dos pacientes da clínica</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3.5 h-3.5" />
            {patients.length} pacientes
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Lista de Pacientes</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando pacientes...</div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhum paciente encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data Nasc.</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.cpf || "—"}</TableCell>
                        <TableCell>
                          {p.phone ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Phone className="w-3.5 h-3.5" /> {p.phone}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.date_of_birth || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
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

export default ReceptionPatients;

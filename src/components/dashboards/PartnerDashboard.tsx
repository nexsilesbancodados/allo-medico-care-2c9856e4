import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pill, FlaskConical, CheckCircle, XCircle, FileText, UserCog } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const partnerNav = [
  { label: "Validação", href: "/dashboard", icon: <Pill className="w-4 h-4" />, active: true },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState("");
  const [foundPrescription, setFoundPrescription] = useState<any>(null);
  const [validations, setValidations] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchValidations(); }, []);

  const fetchValidations = async () => {
    if (!user) return;
    const { data } = await supabase.from("prescription_validations")
      .select("id, prescription_id, status, notes, created_at")
      .eq("validated_by", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setValidations(data ?? []);
    setLoading(false);
  };

  const searchPrescription = async () => {
    if (!prescriptionCode.trim()) return;
    setSearching(true);
    setFoundPrescription(null);

    // Search by prescription ID prefix
    const { data } = await supabase.from("prescriptions")
      .select("id, diagnosis, medications, observations, created_at, doctor_id, patient_id")
      .ilike("id", `${prescriptionCode}%`)
      .limit(1)
      .single();

    if (data) {
      // Get doctor and patient names
      const [docRes, patRes] = await Promise.all([
        supabase.from("doctor_profiles").select("user_id").eq("id", data.doctor_id).single(),
        supabase.from("profiles").select("first_name, last_name").eq("user_id", data.patient_id).single(),
      ]);
      let doctorName = "—";
      if (docRes.data) {
        const { data: docProfile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", docRes.data.user_id).single();
        if (docProfile) doctorName = `Dr(a). ${docProfile.first_name} ${docProfile.last_name}`;
      }
      setFoundPrescription({
        ...data,
        doctor_name: doctorName,
        patient_name: patRes.data ? `${patRes.data.first_name} ${patRes.data.last_name}` : "—",
        medications: Array.isArray(data.medications) ? data.medications : [],
      });
    } else {
      toast.error("Receita não encontrada. Verifique o código.");
    }
    setSearching(false);
  };

  const validatePrescription = async (status: string) => {
    if (!foundPrescription || !user) return;
    const { error } = await supabase.from("prescription_validations").insert({
      prescription_id: foundPrescription.id,
      validated_by: user.id,
      status,
      notes: status === "dispensed" ? "Medicamento dispensado" : "Receita validada",
    });
    if (error) {
      toast.error("Erro ao validar receita.");
    } else {
      toast.success(status === "dispensed" ? "Medicamento dispensado com sucesso!" : "Receita validada!");
      setFoundPrescription(null);
      setPrescriptionCode("");
      fetchValidations();
    }
  };

  return (
    <DashboardLayout title="Portal do Parceiro" nav={partnerNav}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Portal de Parceiros</h1>
        <p className="text-muted-foreground mb-6">Validação de receitas e pedidos de exame</p>

        <Tabs defaultValue="validate">
          <TabsList>
            <TabsTrigger value="validate"><Pill className="w-4 h-4 mr-1" /> Validar Receita</TabsTrigger>
            <TabsTrigger value="history"><FileText className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="validate" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Consultar Receita Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Código da receita (ID)..."
                      value={prescriptionCode}
                      onChange={e => setPrescriptionCode(e.target.value)}
                      className="pl-10"
                      onKeyDown={e => e.key === "Enter" && searchPrescription()}
                    />
                  </div>
                  <Button onClick={searchPrescription} disabled={searching}>
                    {searching ? "Buscando..." : "Buscar"}
                  </Button>
                </div>

                {foundPrescription && (
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">✅ Receita Autêntica</Badge>
                      <span className="text-xs text-muted-foreground font-mono">{foundPrescription.id.slice(0, 12)}...</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Paciente</p>
                        <p className="font-medium text-foreground">{foundPrescription.patient_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Médico</p>
                        <p className="font-medium text-foreground">{foundPrescription.doctor_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-foreground">{format(new Date(foundPrescription.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Diagnóstico</p>
                        <p className="text-foreground">{foundPrescription.diagnosis ?? "—"}</p>
                      </div>
                    </div>
                    {foundPrescription.medications.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Medicamentos</p>
                        <div className="space-y-1">
                          {foundPrescription.medications.map((med: any, i: number) => (
                            <div key={i} className="text-sm p-2 rounded bg-muted/50">
                              <span className="font-medium text-foreground">{med.name ?? med}</span>
                              {med.dosage && <span className="text-muted-foreground"> · {med.dosage}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => validatePrescription("dispensed")} className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-1" /> Dispensar Medicamento
                      </Button>
                      <Button variant="outline" onClick={() => validatePrescription("validated")} className="flex-1">
                        Apenas Validar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg">Validações Recentes</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p className="text-muted-foreground">Carregando...</p> : validations.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma validação realizada.</p>
                ) : (
                  <div className="space-y-2">
                    {validations.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded border border-border">
                        <div>
                          <p className="text-sm font-mono text-foreground">{v.prescription_id.slice(0, 12)}...</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(v.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                        </div>
                        <Badge variant={v.status === "dispensed" ? "default" : "secondary"}>
                          {v.status === "dispensed" ? "Dispensado" : v.status === "validated" ? "Validado" : v.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pill, FlaskConical, CheckCircle, FileText, UserCog, Sparkles, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useGsapEntrance } from "@/hooks/use-gsap-entrance";

const getPartnerNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard?role=partner", icon: <TrendingUp className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Validar Receitas", href: "/dashboard/partner/validate?role=partner", icon: <Pill className="w-4 h-4" />, active: active === "validate", group: "Principal" },
  { label: "Histórico", href: "/dashboard/partner/history?role=partner", icon: <FileText className="w-4 h-4" />, active: active === "history", group: "Operações" },
  { label: "Conversão", href: "/dashboard/partner/conversion?role=partner", icon: <FlaskConical className="w-4 h-4" />, active: active === "conversion", group: "Operações" },
  { label: "Perfil", href: "/dashboard/profile?role=partner", icon: <UserCog className="w-4 h-4" />, active: active === "profile", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=partner", icon: <Search className="w-4 h-4" />, active: active === "settings", group: "Conta" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const PartnerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [prescriptionCode, setPrescriptionCode] = useState("");
  const kpiRef = useGsapEntrance({ stagger: 0.07, y: 14, delay: 0.2 });
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
    const { data } = await supabase.from("prescriptions")
      .select("id, diagnosis, medications, observations, created_at, doctor_id, patient_id")
      .ilike("id", `${prescriptionCode}%`)
      .limit(1)
      .single();
    if (data) {
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
        ...data, doctor_name: doctorName,
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

    // Check if prescription was already validated (UNIQUE constraint)
    const { data: existing } = await supabase.from("prescription_validations")
      .select("id, created_at")
      .eq("prescription_id", foundPrescription.id)
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error(`Esta receita já foi dispensada em ${format(new Date(existing[0].created_at), "dd/MM/yyyy", { locale: ptBR })}.`);
      return;
    }

    const { error } = await supabase.from("prescription_validations").insert({
      prescription_id: foundPrescription.id, validated_by: user.id, status,
      notes: status === "dispensed" ? "Medicamento dispensado" : "Receita validada",
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Esta receita já foi dispensada anteriormente.");
      } else {
        toast.error("Erro ao validar receita.");
      }
    } else {
      toast.success(status === "dispensed" ? "Medicamento dispensado com sucesso!" : "Receita validada!");
      setFoundPrescription(null); setPrescriptionCode(""); fetchValidations();
    }
  };

  const dispensedCount = validations.filter(v => v.status === "dispensed").length;
  const conversionRate = validations.length > 0 ? Math.round((dispensedCount / validations.length) * 100) : 0;

  const pathSegment = location.pathname.split("/").pop() || "";
  const activeNav = ["validate", "history", "conversion"].includes(pathSegment) ? pathSegment : "overview";

  return (
    <DashboardLayout title="Portal do Parceiro" nav={getPartnerNav(activeNav)}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl space-y-6">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Portal de Parceiros</h1>
            <p className="text-sm text-muted-foreground mt-1">Validação de receitas e pedidos de exame</p>
          </div>
          <Badge variant="outline" className="text-xs border-success/30 bg-success/10 text-success px-3 py-1.5 rounded-xl">
            <CheckCircle className="w-3 h-3 mr-1" /> Farmácia Ativa
          </Badge>
        </motion.div>

        {/* KPI cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3" role="list" aria-label="Estatísticas do parceiro">
          {[
            { label: "Validações", value: validations.length, icon: Pill, color: "text-primary", bg: "bg-primary/10" },
            { label: "Dispensados", value: dispensedCount, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
            { label: "Conversão", value: `${conversionRate}%`, icon: TrendingUp, color: "text-warning", bg: "bg-warning/10" },
          ].map(kpi => (
            <div key={kpi.label} className="kpi-card p-4 rounded-2xl bg-card border border-border/50" role="listitem" aria-label={`${kpi.label}: ${kpi.value}`}>
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-foreground" aria-hidden="true">{kpi.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <Tabs defaultValue="validate">
            <TabsList className="bg-muted/50 border border-border/40 h-10 rounded-xl p-1">
              <TabsTrigger value="validate" className="rounded-lg text-xs gap-1.5"><Pill className="w-3.5 h-3.5" /> Validar</TabsTrigger>
              <TabsTrigger value="conversion" className="rounded-lg text-xs gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Conversão</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="validate" className="mt-5">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Consultar Receita Digital</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Código da receita (ID)..." value={prescriptionCode} onChange={e => setPrescriptionCode(e.target.value)} className="pl-10 rounded-xl" onKeyDown={e => e.key === "Enter" && searchPrescription()} />
                    </div>
                    <Button onClick={searchPrescription} disabled={searching} className="rounded-xl">{searching ? "Buscando..." : "Buscar"}</Button>
                  </div>

                  {foundPrescription && (
                    <div className="border border-border/50 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="default">✅ Receita Autêntica</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{foundPrescription.id.slice(0, 12)}...</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                          { label: "Paciente", value: foundPrescription.patient_name },
                          { label: "Médico", value: foundPrescription.doctor_name },
                          { label: "Data", value: format(new Date(foundPrescription.created_at), "dd/MM/yyyy", { locale: ptBR }) },
                          { label: "Diagnóstico", value: foundPrescription.diagnosis ?? "—" },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-xs text-muted-foreground">{f.label}</p>
                            <p className="font-medium text-foreground">{f.value}</p>
                          </div>
                        ))}
                      </div>
                      {foundPrescription.medications.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Medicamentos</p>
                          <div className="space-y-1.5">
                            {foundPrescription.medications.map((med: any, i: number) => (
                              <div key={i} className="text-sm p-3 rounded-xl bg-muted/40 border border-border/30">
                                <span className="font-medium text-foreground">{typeof med === 'string' ? med : med.name ?? med}</span>
                                {typeof med !== 'string' && med.dosage && <span className="text-muted-foreground"> · {med.dosage}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button onClick={() => validatePrescription("dispensed")} className="flex-1 rounded-xl">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Dispensar
                        </Button>
                        <Button variant="outline" onClick={() => validatePrescription("validated")} className="flex-1 rounded-xl">
                          Apenas Validar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="mt-5 space-y-4">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Relatório de Conversão</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    De cada receita validada, <strong className="text-foreground">{conversionRate}%</strong> resultaram em dispensação de medicamento.
                  </p>
                  {/* Conversion funnel */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-8 rounded-xl bg-primary/10 flex items-center px-3">
                        <span className="text-xs font-semibold text-primary">Receitas consultadas</span>
                        <span className="ml-auto text-sm font-bold text-primary">{validations.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <div className="flex-1 h-8 rounded-xl bg-success/10 flex items-center px-3" style={{ maxWidth: `${Math.max(conversionRate, 20)}%` }}>
                        <span className="text-xs font-semibold text-success">Dispensados</span>
                        <span className="ml-auto text-sm font-bold text-success">{dispensedCount}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conversionRate >= 80 ? "🎉 Excelente taxa de conversão!" 
                    : conversionRate >= 50 ? "👍 Boa taxa — continue assim!" 
                    : "💡 Dica: Ofereça alternativas genéricas para aumentar a conversão"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-5">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Validações Recentes</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <p className="text-muted-foreground">Carregando...</p> : validations.length === 0 ? (
                    <div className="text-center py-10">
                      <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma validação realizada.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {validations.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
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
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;

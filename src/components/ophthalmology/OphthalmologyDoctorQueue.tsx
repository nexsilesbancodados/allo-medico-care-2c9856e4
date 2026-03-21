import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, Search, Clock, CheckCircle2, AlertCircle, Loader2, Glasses, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import OphthalmologyPrescriptionForm from "./OphthalmologyPrescriptionForm";

interface OphExam {
  id: string;
  patient_name: string;
  patient_cpf: string | null;
  exam_type: string;
  od_spherical: number | null;
  od_cylindrical: number | null;
  od_axis: number | null;
  oe_spherical: number | null;
  oe_cylindrical: number | null;
  oe_axis: number | null;
  od_acuity: string | null;
  oe_acuity: string | null;
  intraocular_pressure_od: number | null;
  intraocular_pressure_oe: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  in_review: { label: "Em Análise", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Eye },
  completed: { label: "Concluído", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircle },
};

const OphthalmologyDoctorQueue = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<OphExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<OphExam | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ophthalmology_exams" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setExams(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const filtered = exams.filter(e => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search && !e.patient_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleClaim = async (exam: OphExam) => {
    const { error } = await supabase
      .from("ophthalmology_exams" as any)
      .update({ status: "in_review", assigned_doctor_id: user?.id } as any)
      .eq("id", exam.id);
    if (error) { toast.error("Erro ao assumir exame"); return; }
    toast.success("Exame assumido!");
    setSelectedExam({ ...exam, status: "in_review" });
    fetchExams();
  };

  if (selectedExam) {
    return (
      <OphthalmologyPrescriptionForm
        exam={selectedExam}
        onBack={() => { setSelectedExam(null); fetchExams(); }}
      />
    );
  }

  const pendingCount = exams.filter(e => e.status === "pending").length;
  const completedCount = exams.filter(e => e.status === "completed").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-sm">
              <Glasses className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Oftalmológico</h1>
              <p className="text-white/80 text-sm">Analise exames e emita receitas de óculos</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-white/70">Pendentes</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-white/70">Concluídos</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold">{exams.length}</p>
              <p className="text-xs text-white/70">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "in_review", "completed"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="rounded-xl text-xs">
              {s === "all" ? "Todos" : STATUS_MAP[s]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/20 rounded-2xl">
          <CardContent className="py-12 text-center">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum exame encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(exam => {
            const st = STATUS_MAP[exam.status] || STATUS_MAP.pending;
            const Icon = st.icon;
            return (
              <Card key={exam.id} className="border-border/20 rounded-2xl hover:shadow-lg transition-all group cursor-pointer" onClick={() => exam.status === "pending" ? handleClaim(exam) : setSelectedExam(exam)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                    <Eye className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">{exam.patient_name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${st.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {st.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{exam.exam_type}</span>
                      {exam.od_spherical != null && <span>OD: {exam.od_spherical > 0 ? "+" : ""}{exam.od_spherical}</span>}
                      {exam.oe_spherical != null && <span>OE: {exam.oe_spherical > 0 ? "+" : ""}{exam.oe_spherical}</span>}
                      <span>{format(new Date(exam.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OphthalmologyDoctorQueue;

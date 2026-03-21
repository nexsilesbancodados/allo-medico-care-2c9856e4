import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ClipboardList, Eye, UserCheck, Search, X, ThumbsUp, ChevronDown,
  FileEdit, Mic, Download, Share2, Send, Filter, Calendar, Sun, Moon, Cloud,
  ArrowLeft, CalendarDays, CalendarRange, User2
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/* ── Status config ── */
const statusLabels: Record<string, string> = {
  pending: "PENDENTE",
  in_review: "DIGITANDO",
  reported: "PRONTO",
  delivered: "ASSINADO",
  unsigned: "NÃO ASSINADO",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40",
  in_review: "bg-blue-500/15 text-blue-700 border-blue-500/40",
  reported: "bg-green-500/15 text-green-700 border-green-500/40",
  delivered: "bg-muted text-muted-foreground border-border",
  unsigned: "bg-orange-500/15 text-orange-700 border-orange-500/40",
};

const MODALITIES = ["RF", "CT", "CR", "DX", "US", "MG", "MR"] as const;
const LAUDO_STATUSES = ["pending", "in_review", "reported", "unsigned"] as const;

type DatePreset = "hoje" | "manha" | "tarde" | "noite" | "ontem" | "semana" | "mes" | "custom";

const ExamReportQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  /* ── Filter state ── */
  const [datePreset, setDatePreset] = useState<DatePreset>("hoje");
  const [dateStart, setDateStart] = useState(format(new Date(), "yyyy-MM-dd'T'00:00:00"));
  const [dateEnd, setDateEnd] = useState(format(new Date(), "yyyy-MM-dd'T'23:59:59"));
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...LAUDO_STATUSES]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([...MODALITIES]);
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* Apply date preset */
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (preset) {
      case "hoje":
        setDateStart(format(today, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(todayEnd, "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "manha":
        setDateStart(format(today, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(setMinutes(setHours(today, 12), 0), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "tarde":
        setDateStart(format(setHours(today, 12), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(setHours(today, 18), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "noite":
        setDateStart(format(setHours(today, 18), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(todayEnd, "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "ontem": {
        const yesterday = subDays(today, 1);
        setDateStart(format(yesterday, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfDay(yesterday), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      }
      case "semana":
        setDateStart(format(startOfWeek(now, { locale: ptBR }), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfWeek(now, { locale: ptBR }), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "mes":
        setDateStart(format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "custom":
        break;
    }
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };
  const toggleModality = (m: string) => {
    setSelectedModalities(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };
  const clearFilters = () => {
    setPatientSearch("");
    setSelectedStatuses([...LAUDO_STATUSES]);
    setSelectedModalities([...MODALITIES]);
    setPriorityFilter("all");
    applyPreset("hoje");
  };

  /* ── Queries ── */
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-queue", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["exam-requests-queue", dateStart, dateEnd, selectedStatuses, selectedModalities, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("exam_requests" as never)
        .select("*")
        .gte("created_at", dateStart)
        .lte("created_at", dateEnd)
        .order("created_at", { ascending: false });

      if (selectedStatuses.length > 0 && selectedStatuses.length < LAUDO_STATUSES.length) {
        query = query.in("status", selectedStatuses);
      }
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const patientIds = [...new Set((data || []).filter((e: any) => e.patient_id).map((e: any) => e.patient_id))];
      let patientMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", patientIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            patientMap[p.user_id] = `${p.first_name} ${p.last_name}`.trim();
          });
        }
      }

      return (data || []).map((e: any) => ({
        ...e,
        patient_name: e.patient_id ? patientMap[e.patient_id] || "Paciente" : (e.clinical_info?.match(/Paciente: (.+)/)?.[1] || "—"),
      }));
    },
    enabled: !!user,
  });

  /* ── Client-side filters ── */
  const filtered = useMemo(() => {
    if (!examRequests) return [];
    let list = examRequests;
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      list = list.filter((e: any) =>
        e.patient_name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q)
      );
    }
    if (selectedModalities.length < MODALITIES.length) {
      list = list.filter((e: any) => {
        const type = (e.exam_type || "").toUpperCase();
        return selectedModalities.some(m => type.includes(m));
      });
    }
    return list;
  }, [examRequests, patientSearch, selectedModalities]);

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) return;
    setClaimingId(examId);
    try {
      const { error } = await supabase
        .from("exam_requests" as any)
        .update({ assigned_to: doctorProfile.id, status: "in_review" } as any)
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setClaimingId(null);
    }
  };

  const presetBtns: { key: DatePreset; label: string; icon: React.ReactNode }[] = [
    { key: "hoje", label: "Hoje", icon: <Calendar className="w-4 h-4" /> },
    { key: "manha", label: "Manhã", icon: <Sun className="w-4 h-4" /> },
    { key: "tarde", label: "Tarde", icon: <Cloud className="w-4 h-4" /> },
    { key: "noite", label: "Noite", icon: <Moon className="w-4 h-4" /> },
    { key: "ontem", label: "Ontem", icon: <ArrowLeft className="w-4 h-4" /> },
    { key: "semana", label: "Semana", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "mes", label: "Mês", icon: <CalendarRange className="w-4 h-4" /> },
    { key: "custom", label: "Personalizado", icon: <User2 className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout nav={getDoctorNav("report-queue")} title="Fila de Laudos">
      {/* ── Filters Panel ── */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="default" size="sm" className="mb-2 gap-2">
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Date Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                {presetBtns.map(p => (
                  <Button
                    key={p.key}
                    variant={datePreset === p.key ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => applyPreset(p.key)}
                  >
                    {p.icon}
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Date Range + Patient */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Início <span className="text-destructive">*</span></label>
                  <Input
                    type="datetime-local"
                    value={dateStart.replace("T", "T")}
                    onChange={e => { setDateStart(e.target.value); setDatePreset("custom"); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Fim <span className="text-destructive">*</span></label>
                  <Input
                    type="datetime-local"
                    value={dateEnd.replace("T", "T")}
                    onChange={e => { setDateEnd(e.target.value); setDatePreset("custom"); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                  <Input
                    placeholder="Id ou Nome"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Laudo Status + Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Laudo</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {LAUDO_STATUSES.map(s => (
                      <Badge
                        key={s}
                        variant={selectedStatuses.includes(s) ? "default" : "outline"}
                        className="cursor-pointer gap-1 select-none"
                        onClick={() => toggleStatus(s)}
                      >
                        {statusLabels[s]}
                        {selectedStatuses.includes(s) && <X className="w-3 h-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { value: "all", label: "Todas" },
                      { value: "urgent", label: "Urgente" },
                      { value: "normal", label: "Normal" },
                    ].map(p => (
                      <Badge
                        key={p.value}
                        variant={priorityFilter === p.value ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => setPriorityFilter(p.value)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modalities */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Modalidades <span className="text-destructive">*</span></label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {MODALITIES.map(m => (
                    <Badge
                      key={m}
                      variant={selectedModalities.includes(m) ? "default" : "outline"}
                      className="cursor-pointer gap-1 select-none"
                      onClick={() => toggleModality(m)}
                    >
                      {m}
                      {selectedModalities.includes(m) && <X className="w-3 h-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] })} className="gap-2">
                  <Search className="w-4 h-4" /> Pesquisar
                </Button>
                <Button variant="secondary" onClick={clearFilters} className="gap-2">
                  <FileEdit className="w-4 h-4" /> Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Worklist ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-primary" />
            Exames ({filtered?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered?.length ? (
            <p className="text-center text-muted-foreground py-8">Nenhum exame encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="font-semibold">Prioridade ↕</TableHead>
                    <TableHead className="font-semibold">Paciente ↕</TableHead>
                    <TableHead className="font-semibold">Procedimento ↕</TableHead>
                    <TableHead className="font-semibold">Data/Hora ↕</TableHead>
                    <TableHead className="font-semibold">Laudo ↕</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exam: any) => (
                    <TableRow key={exam.id} className="group hover:bg-muted/50">
                      {/* Priority */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className={`w-5 h-5 ${exam.priority === "urgent" ? "text-destructive" : "text-green-500"}`} />
                        </div>
                      </TableCell>

                      {/* Patient */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">{exam.patient_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Id: {exam.id?.substring(0, 20)}...
                          </p>
                        </div>
                      </TableCell>

                      {/* Procedure */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {(exam.exam_type || "DX").substring(0, 2).toUpperCase()}
                          </Badge>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">{exam.exam_type}</p>
                            <p className="text-xs text-muted-foreground">
                              Data de Criação: {format(new Date(exam.created_at), "dd/MM/yyyy - HH:mm:ss", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(exam.created_at), "EEEE,", { locale: ptBR })}</p>
                          <p>{format(new Date(exam.created_at), "dd/MM/yyyy-HH:mm:ss", { locale: ptBR })}</p>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge className={`${statusColors[exam.status] || ""} gap-1`} variant="outline">
                          📄 {statusLabels[exam.status] || exam.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Visualizar"
                            onClick={() => navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* Expand */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Detalhes">
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          {/* Edit */}
                          {(exam.status === "in_review" || exam.status === "pending") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Editar Laudo"
                              onClick={() => {
                                if (exam.status === "pending") {
                                  handleClaim(exam.id);
                                } else {
                                  navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`);
                                }
                              }}
                            >
                              {claimingId === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
                            </Button>
                          )}
                          {/* Dictation */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Ditado">
                            <Mic className="w-4 h-4" />
                          </Button>
                          {/* Download */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Download">
                            <Download className="w-4 h-4" />
                          </Button>
                          {/* Share */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Compartilhar">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          {/* Send */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Enviar">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ExamReportQueue;

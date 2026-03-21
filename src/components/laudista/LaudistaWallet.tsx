import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "./laudistaNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Stethoscope, Phone, Mail, Award, QrCode, Copy, CheckCircle2, FileText, Star, Microscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

const LaudistaWallet = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["laudista-wallet", user?.id],
    queryFn: async () => {
      const dpRes = await supabase.from("doctor_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (!dpRes.data) return null;
      const dpId = dpRes.data.id;

      const [specsRes, totalRes, signedRes] = await Promise.all([
        supabase.from("doctor_specialties").select("specialty_id, specialties(name)").eq("doctor_id", dpId),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).not("signed_at", "is", null),
      ]);

      return {
        doctor: dpRes.data,
        specialties: (specsRes.data ?? []).map((s: any) => s.specialties?.name).filter(Boolean),
        totalReports: totalRes.count ?? 0,
        signedReports: signedRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const fullName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const crmFull = data?.doctor ? `CRM ${data.doctor.crm}/${data.doctor.crm_state}` : "";

  const copyId = () => {
    navigator.clipboard.writeText(data?.doctor?.id ?? "");
    setCopied(true);
    toast.success("ID copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Laudista" nav={getLaudistaNav("wallet")} role="doctor">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Carteira de Médico Laudista
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : !data ? (
          <p className="text-muted-foreground text-center py-12">Perfil médico não encontrado.</p>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border-2 border-secondary/30 shadow-2xl">
            {/* Header gradient - secondary/teal for laudista */}
            <div className="bg-gradient-to-r from-secondary via-secondary/90 to-primary p-6 pb-14 relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Microscope className="w-5 h-5 text-white/80" />
                    <span className="text-white/70 text-xs font-medium tracking-wider uppercase">Allo Médico · Telelaudo</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{fullName}</h3>
                  <p className="text-white/80 text-sm font-mono mt-0.5">{crmFull}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-card p-6 -mt-6 rounded-t-2xl relative z-10 space-y-5">
              <div className="flex items-center gap-4 -mt-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-card shadow-lg">
                  {(profile?.first_name?.[0] ?? "L").toUpperCase()}
                </div>
                <div className="mt-6 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20 gap-1 text-xs">
                      <Microscope className="w-3 h-3" /> Médico Laudista
                    </Badge>
                    {data.doctor.crm_verified && (
                      <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
                        <Shield className="w-3 h-3" /> CRM Verificado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {data.specialties.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.specialties.map((s: string) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xl font-black text-foreground">{data.totalReports}</p>
                  <p className="text-[10px] text-muted-foreground">Laudos Totais</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xl font-black text-foreground">{data.signedReports}</p>
                  <p className="text-[10px] text-muted-foreground">Assinados</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xl font-black text-foreground flex items-center justify-center gap-0.5">
                    50% <Star className="w-3 h-3 text-warning" />
                  </p>
                  <p className="text-[10px] text-muted-foreground">Repasse</p>
                </div>
              </div>

              <div className="space-y-2">
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /><span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /><span>{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground">ID do Laudista</p>
                  <p className="text-xs font-mono text-foreground">{data.doctor.id?.slice(0, 8)}...</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={copyId}>
                  {copied ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copiado" : "Copiar ID"}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                Membro desde {data.doctor.created_at ? format(new Date(data.doctor.created_at), "MMMM 'de' yyyy", { locale: ptBR }) : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LaudistaWallet;

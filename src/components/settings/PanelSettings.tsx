import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Bell, Globe, Shield, Clock, Monitor, Palette, Loader2, Pencil, ChevronRight, Info, LogOut } from "lucide-react";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getPatientNav } from "@/components/patient/patientNav";
import { getAdminNav } from "@/components/admin/adminNav";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { toast } from "sonner";
import { motion } from "framer-motion";

const roleLabels: Record<string, string> = {
  patient: "Paciente", doctor: "Médico", admin: "Administração",
  receptionist: "Recepção", support: "Suporte", clinic: "Clínica", partner: "Parceiro",
};

function getNavForRole(role: string) {
  switch (role) {
    case "doctor": return getDoctorNav("settings");
    case "patient": return getPatientNav("settings");
    case "admin": return getAdminNav("settings");
    case "receptionist": return getReceptionNav("settings");
    default: return [];
  }
}

type SettingsState = Record<string, any>;

const defaultSettings: Record<string, SettingsState> = {
  patient: {
    reminder_whatsapp: true, reminder_email: true, push_notifications: true, med_alerts: false,
    share_history: true, allow_exam_access: true, language: "Português", timezone: "America/Sao_Paulo",
  },
  doctor: {
    default_duration: "30 min", accept_urgent: false, auto_confirm: true,
    notify_new_appt: true, notify_cancel: true, notify_message: true, sound_alert: true,
    use_memed: true, auto_cid: false, public_profile: true, show_ratings: true,
  },
  admin: {
    maintenance_mode: false, open_registration: true, auto_approve_doctors: false,
    notify_new_doctor: true, notify_new_clinic: true, notify_payments: true, weekly_reports: true,
    require_2fa: false, detailed_logs: true, session_timeout: "4 horas",
  },
  receptionist: {
    auto_checkin: true, notify_doctor_checkin: true, sound_alert: true, notify_cancel: true,
    print_checkin: false, print_receipts: false,
  },
};

/* ── Grouped section config ── */
interface SettingItem { key: string; label: string; type: "toggle" | "select"; options?: string[] }
interface SettingGroup { title: string; icon: typeof Bell; items: SettingItem[] }

const patientGroups: SettingGroup[] = [
  {
    title: "Preferências", icon: Bell, items: [
      { key: "reminder_whatsapp", label: "Alertas, lembretes de consultas", type: "toggle" },
      { key: "push_notifications", label: "Notificações push", type: "toggle" },
      { key: "language", label: "Idioma", type: "select", options: ["Português (Brasil)", "English", "Español"] },
    ],
  },
  {
    title: "Segurança & Privacidade", icon: Shield, items: [
      { key: "share_history", label: "Biometria e Senha de Acesso", type: "toggle" },
      { key: "allow_exam_access", label: "Compartilhamento de dados médicos", type: "toggle" },
    ],
  },
  {
    title: "Informações", icon: Info, items: [],
  },
];

const PanelSettings = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const forceRole = searchParams.get("role");
  const isAdmin = roles.includes("admin");
  const activeRole = isAdmin && forceRole ? forceRole
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : "patient";

  const nav = getNavForRole(activeRole);
  const backHref = `/dashboard${forceRole ? `?role=${forceRole}` : ""}`;

  const [settings, setSettings] = useState<SettingsState>(defaultSettings[activeRole] ?? { notify_email: true, notify_push: true, language: "Português" });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingSettings(true);
      const { data } = await supabase.from("profiles").select("settings").eq("user_id", user.id).maybeSingle();
      if (data?.settings && typeof data.settings === "object") {
        const saved = (data.settings as Record<string, any>)[activeRole];
        if (saved && typeof saved === "object") setSettings(prev => ({ ...prev, ...saved }));
      }
      setLoadingSettings(false);
    };
    load();
  }, [user, activeRole]);

  const handleChange = useCallback((key: string, val: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase.from("profiles").select("settings").eq("user_id", user.id).maybeSingle();
    const allSettings = (existing?.settings && typeof existing.settings === "object") ? { ...(existing.settings as Record<string, any>) } : {};
    allSettings[activeRole] = settings;
    const { error } = await supabase.from("profiles").update({ settings: allSettings } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar", { description: error.message });
    else toast.success("Configurações salvas!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase();
  const groups = activeRole === "patient" ? patientGroups : patientGroups; // Extend for other roles

  return (
    <DashboardLayout title={roleLabels[activeRole] ?? "Configurações"} nav={nav} role={activeRole}>
      <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => navigate(`/dashboard/profile?role=${activeRole}`)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          <h1 className="text-xl font-extrabold text-foreground font-[Manrope]">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências e segurança</p>
        </div>

        {loadingSettings ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-6">
            {groups.map((group, gi) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 px-1">{group.title}</p>
                <div className="rounded-2xl bg-card border border-border/30 overflow-hidden divide-y divide-border/10">
                  {group.items.map((item, ii) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (gi * group.items.length + ii) * 0.03 }}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                          <group.icon className="w-4 h-4 text-primary" />
                        </div>
                        <Label className="text-sm text-foreground cursor-pointer">{item.label}</Label>
                      </div>
                      {item.type === "toggle" ? (
                        <Switch checked={settings[item.key] ?? false} onCheckedChange={v => handleChange(item.key, v)} />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </motion.div>
                  ))}
                  {group.title === "Informações" && (
                    <button
                      onClick={() => {}}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Sobre o App</p>
                        <p className="text-xs text-muted-foreground">Versão 2.4.1 (Build 890)</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors text-destructive font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>

            <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-full" size="lg">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PanelSettings;

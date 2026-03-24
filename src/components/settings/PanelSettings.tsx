import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Shield, Clock, Monitor, Palette, Loader2 } from "lucide-react";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getPatientNav } from "@/components/patient/patientNav";
import { getAdminNav } from "@/components/admin/adminNav";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  patient: "Paciente",
  doctor: "Médico",
  admin: "Administração",
  receptionist: "Recepção",
  support: "Suporte",
  clinic: "Clínica",
  partner: "Parceiro",
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

// Settings context to share state between components
type SettingsState = Record<string, any>;

const defaultSettings: Record<string, SettingsState> = {
  patient: {
    reminder_whatsapp: true, reminder_email: true, push_notifications: true, med_alerts: false,
    share_history: true, allow_exam_access: true,
    language: "Português", timezone: "America/Sao_Paulo",
  },
  doctor: {
    default_duration: "30 min", accept_urgent: false, auto_confirm: true,
    notify_new_appt: true, notify_cancel: true, notify_message: true, sound_alert: true,
    use_memed: true, auto_cid: false,
    public_profile: true, show_ratings: true,
  },
  admin: {
    maintenance_mode: false, open_registration: true, auto_approve_doctors: false,
    notify_new_doctor: true, notify_new_clinic: true, notify_payments: true, weekly_reports: true,
    require_2fa: false, detailed_logs: true, session_timeout: "4 horas",
  },
  receptionist: {
    auto_checkin: true, notify_doctor_checkin: true,
    sound_alert: true, notify_cancel: true,
    print_checkin: false, print_receipts: false,
  },
};

/* ── Setting sections per role ── */

const PatientSettings = ({ settings, onChange }: { settings: SettingsState; onChange: (key: string, val: boolean | string) => void }) => (
  <>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Lembrete de consulta (WhatsApp)" checked={settings.reminder_whatsapp} onChange={v => onChange("reminder_whatsapp", v)} />
      <SettingToggle label="Lembrete de consulta (E-mail)" checked={settings.reminder_email} onChange={v => onChange("reminder_email", v)} />
      <SettingToggle label="Notificações push" checked={settings.push_notifications} onChange={v => onChange("push_notifications", v)} />
      <SettingToggle label="Alertas de medicamento" checked={settings.med_alerts} onChange={v => onChange("med_alerts", v)} />
    </SettingSection>
    <SettingSection title="Privacidade" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Compartilhar histórico com novos médicos" checked={settings.share_history} onChange={v => onChange("share_history", v)} />
      <SettingToggle label="Permitir acesso aos exames pelo médico" checked={settings.allow_exam_access} onChange={v => onChange("allow_exam_access", v)} />
    </SettingSection>
    <SettingSection title="Preferências" icon={<Palette className="w-4 h-4" />}>
      <SettingSelect label="Idioma" options={["Português", "English", "Español"]} value={settings.language} onChange={v => onChange("language", v)} />
      <SettingSelect label="Fuso horário" options={["America/Sao_Paulo", "America/Manaus", "America/Bahia"]} value={settings.timezone} onChange={v => onChange("timezone", v)} />
    </SettingSection>
  </>
);

const DoctorSettings = ({ settings, onChange }: { settings: SettingsState; onChange: (key: string, val: boolean | string) => void }) => (
  <>
    <SettingSection title="Consultas" icon={<Clock className="w-4 h-4" />}>
      <SettingSelect label="Duração padrão da consulta" options={["15 min", "20 min", "30 min", "45 min", "60 min"]} value={settings.default_duration} onChange={v => onChange("default_duration", v)} />
      <SettingToggle label="Aceitar consultas de urgência" checked={settings.accept_urgent} onChange={v => onChange("accept_urgent", v)} />
      <SettingToggle label="Auto-confirmar após pagamento" checked={settings.auto_confirm} onChange={v => onChange("auto_confirm", v)} />
    </SettingSection>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Nova consulta agendada" checked={settings.notify_new_appt} onChange={v => onChange("notify_new_appt", v)} />
      <SettingToggle label="Cancelamento de consulta" checked={settings.notify_cancel} onChange={v => onChange("notify_cancel", v)} />
      <SettingToggle label="Mensagem de paciente" checked={settings.notify_message} onChange={v => onChange("notify_message", v)} />
      <SettingToggle label="Alerta sonoro na sala de espera" checked={settings.sound_alert} onChange={v => onChange("sound_alert", v)} />
    </SettingSection>
    <SettingSection title="Receituário" icon={<Monitor className="w-4 h-4" />}>
      <SettingToggle label="Usar Memed para prescrições" checked={settings.use_memed} onChange={v => onChange("use_memed", v)} />
      <SettingToggle label="Incluir CID automaticamente" checked={settings.auto_cid} onChange={v => onChange("auto_cid", v)} />
    </SettingSection>
    <SettingSection title="Privacidade" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Perfil público visível na busca" checked={settings.public_profile} onChange={v => onChange("public_profile", v)} />
      <SettingToggle label="Exibir avaliações no perfil" checked={settings.show_ratings} onChange={v => onChange("show_ratings", v)} />
    </SettingSection>
  </>
);

const AdminSettings = ({ settings, onChange }: { settings: SettingsState; onChange: (key: string, val: boolean | string) => void }) => (
  <>
    <SettingSection title="Plataforma" icon={<Globe className="w-4 h-4" />}>
      <SettingToggle label="Modo manutenção" checked={settings.maintenance_mode} onChange={v => onChange("maintenance_mode", v)} />
      <SettingToggle label="Registro aberto para pacientes" checked={settings.open_registration} onChange={v => onChange("open_registration", v)} />
      <SettingToggle label="Aprovação automática de médicos" checked={settings.auto_approve_doctors} onChange={v => onChange("auto_approve_doctors", v)} />
    </SettingSection>
    <SettingSection title="Notificações Admin" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Novo cadastro de médico" checked={settings.notify_new_doctor} onChange={v => onChange("notify_new_doctor", v)} />
      <SettingToggle label="Novo cadastro de clínica" checked={settings.notify_new_clinic} onChange={v => onChange("notify_new_clinic", v)} />
      <SettingToggle label="Alertas de pagamento" checked={settings.notify_payments} onChange={v => onChange("notify_payments", v)} />
      <SettingToggle label="Relatórios semanais por e-mail" checked={settings.weekly_reports} onChange={v => onChange("weekly_reports", v)} />
    </SettingSection>
    <SettingSection title="Segurança" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Autenticação 2FA obrigatória" checked={settings.require_2fa} onChange={v => onChange("require_2fa", v)} />
      <SettingToggle label="Log de atividades detalhado" checked={settings.detailed_logs} onChange={v => onChange("detailed_logs", v)} />
      <SettingSelect label="Tempo de sessão" options={["30 min", "1 hora", "4 horas", "8 horas"]} value={settings.session_timeout} onChange={v => onChange("session_timeout", v)} />
    </SettingSection>
  </>
);

const ReceptionSettings = ({ settings, onChange }: { settings: SettingsState; onChange: (key: string, val: boolean | string) => void }) => (
  <>
    <SettingSection title="Check-in" icon={<Clock className="w-4 h-4" />}>
      <SettingToggle label="Check-in automático ao confirmar presença" checked={settings.auto_checkin} onChange={v => onChange("auto_checkin", v)} />
      <SettingToggle label="Notificar médico ao fazer check-in" checked={settings.notify_doctor_checkin} onChange={v => onChange("notify_doctor_checkin", v)} />
    </SettingSection>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Alerta sonoro de novo paciente" checked={settings.sound_alert} onChange={v => onChange("sound_alert", v)} />
      <SettingToggle label="Notificação de cancelamento" checked={settings.notify_cancel} onChange={v => onChange("notify_cancel", v)} />
    </SettingSection>
    <SettingSection title="Impressão" icon={<Monitor className="w-4 h-4" />}>
      <SettingToggle label="Imprimir comprovante de check-in" checked={settings.print_checkin} onChange={v => onChange("print_checkin", v)} />
      <SettingToggle label="Imprimir recibos automaticamente" checked={settings.print_receipts} onChange={v => onChange("print_receipts", v)} />
    </SettingSection>
  </>
);

const GenericSettings = ({ settings, onChange }: { settings: SettingsState; onChange: (key: string, val: boolean | string) => void }) => (
  <>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Notificações por e-mail" checked={settings.notify_email ?? true} onChange={v => onChange("notify_email", v)} />
      <SettingToggle label="Notificações push" checked={settings.notify_push ?? true} onChange={v => onChange("notify_push", v)} />
    </SettingSection>
    <SettingSection title="Preferências" icon={<Palette className="w-4 h-4" />}>
      <SettingSelect label="Idioma" options={["Português", "English", "Español"]} value={settings.language ?? "Português"} onChange={v => onChange("language", v)} />
    </SettingSection>
  </>
);

/* ── Reusable setting components ── */

function SettingSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm text-foreground cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SettingSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm text-foreground shrink-0">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Main component ── */

const PanelSettings = () => {
  const { user, roles } = useAuth();
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

  // Load settings from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingSettings(true);
      const { data } = await supabase.from("profiles").select("settings").eq("user_id", user.id).maybeSingle();
      if (data?.settings && typeof data.settings === "object") {
        const saved = (data.settings as Record<string, any>)[activeRole];
        if (saved && typeof saved === "object") {
          setSettings(prev => ({ ...prev, ...saved }));
        }
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
    // Load existing settings to preserve other roles
    const { data: existing } = await supabase.from("profiles").select("settings").eq("user_id", user.id).maybeSingle();
    const allSettings = (existing?.settings && typeof existing.settings === "object") ? { ...(existing.settings as Record<string, any>) } : {};
    allSettings[activeRole] = settings;

    const { error } = await supabase.from("profiles").update({ settings: allSettings } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
    } else {
      toast.success("Configurações salvas", { description: `Preferências do painel ${roleLabels[activeRole]} atualizadas.` });
    }
  };

  return (
    <DashboardLayout title={roleLabels[activeRole] ?? "Configurações"} nav={nav} role={activeRole}>
      <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(backHref)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground mb-6">
          Configurações exclusivas do painel <strong>{roleLabels[activeRole]}</strong>
        </p>

        {loadingSettings ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {activeRole === "patient" && <PatientSettings settings={settings} onChange={handleChange} />}
            {activeRole === "doctor" && <DoctorSettings settings={settings} onChange={handleChange} />}
            {activeRole === "admin" && <AdminSettings settings={settings} onChange={handleChange} />}
            {activeRole === "receptionist" && <ReceptionSettings settings={settings} onChange={handleChange} />}
            {!["patient", "doctor", "admin", "receptionist"].includes(activeRole) && <GenericSettings settings={settings} onChange={handleChange} />}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PanelSettings;

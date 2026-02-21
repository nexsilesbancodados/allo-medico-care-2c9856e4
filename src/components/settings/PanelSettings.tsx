import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Shield, Clock, Monitor, Volume2, Palette } from "lucide-react";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getPatientNav } from "@/components/patient/patientNav";
import { getAdminNav } from "@/components/admin/adminNav";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  patient: "Paciente",
  doctor: "Médico",
  admin: "Administração",
  receptionist: "Recepção",
  support: "Suporte",
  clinic: "Clínica",
  partner: "Parceiro",
  affiliate: "Afiliado",
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

/* ── Setting sections per role ── */

const PatientSettings = () => (
  <>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Lembrete de consulta (WhatsApp)" defaultChecked />
      <SettingToggle label="Lembrete de consulta (E-mail)" defaultChecked />
      <SettingToggle label="Notificações push" defaultChecked />
      <SettingToggle label="Alertas de medicamento" />
    </SettingSection>
    <SettingSection title="Privacidade" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Compartilhar histórico com novos médicos" defaultChecked />
      <SettingToggle label="Permitir acesso aos exames pelo médico" defaultChecked />
    </SettingSection>
    <SettingSection title="Preferências" icon={<Palette className="w-4 h-4" />}>
      <SettingSelect label="Idioma" options={["Português", "English", "Español"]} defaultValue="Português" />
      <SettingSelect label="Fuso horário" options={["America/Sao_Paulo", "America/Manaus", "America/Bahia"]} defaultValue="America/Sao_Paulo" />
    </SettingSection>
  </>
);

const DoctorSettings = () => (
  <>
    <SettingSection title="Consultas" icon={<Clock className="w-4 h-4" />}>
      <SettingSelect label="Duração padrão da consulta" options={["15 min", "20 min", "30 min", "45 min", "60 min"]} defaultValue="30 min" />
      <SettingToggle label="Aceitar consultas de urgência" />
      <SettingToggle label="Auto-confirmar após pagamento" defaultChecked />
    </SettingSection>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Nova consulta agendada" defaultChecked />
      <SettingToggle label="Cancelamento de consulta" defaultChecked />
      <SettingToggle label="Mensagem de paciente" defaultChecked />
      <SettingToggle label="Alerta sonoro na sala de espera" defaultChecked />
    </SettingSection>
    <SettingSection title="Receituário" icon={<Monitor className="w-4 h-4" />}>
      <SettingToggle label="Usar Memed para prescrições" defaultChecked />
      <SettingToggle label="Incluir CID automaticamente" />
    </SettingSection>
    <SettingSection title="Privacidade" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Perfil público visível na busca" defaultChecked />
      <SettingToggle label="Exibir avaliações no perfil" defaultChecked />
    </SettingSection>
  </>
);

const AdminSettings = () => (
  <>
    <SettingSection title="Plataforma" icon={<Globe className="w-4 h-4" />}>
      <SettingToggle label="Modo manutenção" />
      <SettingToggle label="Registro aberto para pacientes" defaultChecked />
      <SettingToggle label="Aprovação automática de médicos" />
    </SettingSection>
    <SettingSection title="Notificações Admin" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Novo cadastro de médico" defaultChecked />
      <SettingToggle label="Novo cadastro de clínica" defaultChecked />
      <SettingToggle label="Alertas de pagamento" defaultChecked />
      <SettingToggle label="Relatórios semanais por e-mail" defaultChecked />
    </SettingSection>
    <SettingSection title="Segurança" icon={<Shield className="w-4 h-4" />}>
      <SettingToggle label="Autenticação 2FA obrigatória" />
      <SettingToggle label="Log de atividades detalhado" defaultChecked />
      <SettingSelect label="Tempo de sessão" options={["30 min", "1 hora", "4 horas", "8 horas"]} defaultValue="4 horas" />
    </SettingSection>
  </>
);

const ReceptionSettings = () => (
  <>
    <SettingSection title="Check-in" icon={<Clock className="w-4 h-4" />}>
      <SettingToggle label="Check-in automático ao confirmar presença" defaultChecked />
      <SettingToggle label="Notificar médico ao fazer check-in" defaultChecked />
    </SettingSection>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Alerta sonoro de novo paciente" defaultChecked />
      <SettingToggle label="Notificação de cancelamento" defaultChecked />
    </SettingSection>
    <SettingSection title="Impressão" icon={<Monitor className="w-4 h-4" />}>
      <SettingToggle label="Imprimir comprovante de check-in" />
      <SettingToggle label="Imprimir recibos automaticamente" />
    </SettingSection>
  </>
);

const GenericSettings = ({ role }: { role: string }) => (
  <>
    <SettingSection title="Notificações" icon={<Bell className="w-4 h-4" />}>
      <SettingToggle label="Notificações por e-mail" defaultChecked />
      <SettingToggle label="Notificações push" defaultChecked />
    </SettingSection>
    <SettingSection title="Preferências" icon={<Palette className="w-4 h-4" />}>
      <SettingSelect label="Idioma" options={["Português", "English", "Español"]} defaultValue="Português" />
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

function SettingToggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm text-foreground cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

function SettingSelect({ label, options, defaultValue }: { label: string; options: string[]; defaultValue: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm text-foreground shrink-0">{label}</Label>
      <Select defaultValue={defaultValue}>
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
  const { roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const forceRole = searchParams.get("role");
  const isAdmin = roles.includes("admin");
  const activeRole = isAdmin && forceRole ? forceRole
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : roles.includes("affiliate") ? "affiliate"
    : "patient";

  const nav = getNavForRole(activeRole);
  const backHref = `/dashboard${forceRole ? `?role=${forceRole}` : ""}`;

  const handleSave = () => {
    toast({ title: "Configurações salvas", description: `Preferências do painel ${roleLabels[activeRole]} atualizadas.` });
  };

  return (
    <DashboardLayout title={roleLabels[activeRole] ?? "Configurações"} nav={nav} role={activeRole}>
      <div className="max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(backHref)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground mb-6">
          Configurações exclusivas do painel <strong>{roleLabels[activeRole]}</strong>
        </p>

        <div className="space-y-4">
          {activeRole === "patient" && <PatientSettings />}
          {activeRole === "doctor" && <DoctorSettings />}
          {activeRole === "admin" && <AdminSettings />}
          {activeRole === "receptionist" && <ReceptionSettings />}
          {!["patient", "doctor", "admin", "receptionist"].includes(activeRole) && <GenericSettings role={activeRole} />}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} className="gap-2">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PanelSettings;

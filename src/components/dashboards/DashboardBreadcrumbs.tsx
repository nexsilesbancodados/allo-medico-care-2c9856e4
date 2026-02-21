import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Painel",
  profile: "Perfil",
  settings: "Configurações",
  schedule: "Agendar",
  appointments: "Agendamentos",
  prescriptions: "Receitas",
  patients: "Pacientes",
  earnings: "Financeiro",
  availability: "Disponibilidade",
  consultations: "Consultas",
  health: "Saúde",
  documents: "Documentos",
  "payment-history": "Pagamentos",
  "waiting-room": "Sala de Espera",
  calendar: "Calendário",
  admin: "Admin",
  doctor: "Médico",
  patient: "Paciente",
  users: "Usuários",
  doctors: "Médicos",
  clinics: "Clínicas",
  plans: "Planos",
  subscriptions: "Assinaturas",
  approvals: "Aprovações",
  reports: "Relatórios",
  logs: "Logs",
  specialties: "Especialidades",
  nps: "NPS",
  whatsapp: "WhatsApp",
  "invite-codes": "Convites",
  support: "Suporte",
  billing: "Faturamento",
  checkin: "Check-in",
  schedules: "Agendas",
  reception: "Recepção",
  clinic: "Clínica",
};

const DashboardBreadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Navegação estrutural" className="flex items-center gap-1 text-xs text-muted-foreground mb-4 flex-wrap">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 opacity-40" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default DashboardBreadcrumbs;

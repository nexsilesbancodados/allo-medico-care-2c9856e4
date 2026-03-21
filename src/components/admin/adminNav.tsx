import { Users, Stethoscope, Building2, Calendar, Shield, CreditCard, FileText, History, KeyRound, TrendingUp, UserCog, UserCheck, Star, MessageCircle, SlidersHorizontal, Video, LayoutGrid, Wallet, Tag, ClipboardList } from "lucide-react";

export const getAdminNav = (active: string) => [
  { label: "Centro de Painéis", href: "/dashboard/admin/panel-center?role=admin", icon: <LayoutGrid className="w-4 h-4" />, active: active === "overview" || active === "panel-center", group: "Principal" },
  { label: "Ao Vivo", href: "/dashboard/admin/live?role=admin", icon: <Video className="w-4 h-4" />, active: active === "live", group: "Principal" },
  { label: "Financeiro", href: "/dashboard/admin/financial?role=admin", icon: <Wallet className="w-4 h-4" />, active: active === "financial", group: "Principal" },
  { label: "Relatórios", href: "/dashboard/admin/reports?role=admin", icon: <TrendingUp className="w-4 h-4" />, active: active === "reports", group: "Principal" },
  { label: "NPS", href: "/dashboard/admin/nps?role=admin", icon: <Star className="w-4 h-4" />, active: active === "nps", group: "Monitoramento" },
  { label: "Aprovações", href: "/dashboard/admin/approvals?role=admin", icon: <UserCheck className="w-4 h-4" />, active: active === "approvals", group: "Monitoramento" },
  { label: "Solicitações Médicos", href: "/dashboard/admin/doctor-applications?role=admin", icon: <ClipboardList className="w-4 h-4" />, active: active === "doctor-applications", group: "Monitoramento" },
  { label: "Usuários", href: "/dashboard/admin/users?role=admin", icon: <UserCog className="w-4 h-4" />, active: active === "users", group: "Gestão" },
  { label: "Pacientes", href: "/dashboard/admin/patients?role=admin", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Gestão" },
  { label: "Médicos", href: "/dashboard/admin/doctors?role=admin", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors", group: "Gestão" },
  { label: "Clínicas", href: "/dashboard/admin/clinics?role=admin", icon: <Building2 className="w-4 h-4" />, active: active === "clinics", group: "Gestão" },
  { label: "Consultas", href: "/dashboard/admin/appointments?role=admin", icon: <Calendar className="w-4 h-4" />, active: active === "appointments", group: "Operações" },
  { label: "Planos", href: "/dashboard/admin/plans?role=admin", icon: <CreditCard className="w-4 h-4" />, active: active === "plans", group: "Operações" },
  { label: "Assinaturas", href: "/dashboard/admin/subscriptions?role=admin", icon: <FileText className="w-4 h-4" />, active: active === "subscriptions", group: "Operações" },
  { label: "Especialidades", href: "/dashboard/admin/specialties?role=admin", icon: <Shield className="w-4 h-4" />, active: active === "specialties", group: "Operações" },
  { label: "Códigos de Convite", href: "/dashboard/admin/invite-codes?role=admin", icon: <KeyRound className="w-4 h-4" />, active: active === "invite-codes", group: "Sistema" },
  { label: "Cupons", href: "/dashboard/admin/coupons?role=admin", icon: <Tag className="w-4 h-4" />, active: active === "coupons", group: "Operações" },
  { label: "Histórico", href: "/dashboard/admin/logs?role=admin", icon: <History className="w-4 h-4" />, active: active === "logs", group: "Sistema" },
  { label: "WhatsApp", href: "/dashboard/admin/whatsapp?role=admin", icon: <MessageCircle className="w-4 h-4" />, active: active === "whatsapp", group: "Sistema" },
  { label: "Configurações", href: "/dashboard/settings?role=admin", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Sistema" },
];

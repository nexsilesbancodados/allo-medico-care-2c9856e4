import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3, CreditCard, FileText, History, KeyRound, TrendingUp, UserCog, UserCheck, Star, MessageCircle, SlidersHorizontal, Video } from "lucide-react";

export const getAdminNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Ao Vivo", href: "/dashboard/admin/live", icon: <Video className="w-4 h-4" />, active: active === "live", group: "Principal" },
  { label: "Relatórios", href: "/dashboard/admin/reports", icon: <TrendingUp className="w-4 h-4" />, active: active === "reports", group: "Principal" },
  { label: "NPS", href: "/dashboard/admin/nps", icon: <Star className="w-4 h-4" />, active: active === "nps", group: "Monitoramento" },
  { label: "Aprovações", href: "/dashboard/admin/approvals", icon: <UserCheck className="w-4 h-4" />, active: active === "approvals", group: "Monitoramento" },
  { label: "Usuários", href: "/dashboard/admin/users", icon: <UserCog className="w-4 h-4" />, active: active === "users", group: "Gestão" },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Gestão" },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors", group: "Gestão" },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" />, active: active === "clinics", group: "Gestão" },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" />, active: active === "appointments", group: "Operações" },
  { label: "Planos", href: "/dashboard/admin/plans", icon: <CreditCard className="w-4 h-4" />, active: active === "plans", group: "Operações" },
  { label: "Assinaturas", href: "/dashboard/admin/subscriptions", icon: <FileText className="w-4 h-4" />, active: active === "subscriptions", group: "Operações" },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" />, active: active === "specialties", group: "Operações" },
  { label: "Códigos de Convite", href: "/dashboard/admin/invite-codes", icon: <KeyRound className="w-4 h-4" />, active: active === "invite-codes", group: "Sistema" },
  { label: "Histórico", href: "/dashboard/admin/logs", icon: <History className="w-4 h-4" />, active: active === "logs", group: "Sistema" },
  { label: "WhatsApp", href: "/dashboard/admin/whatsapp", icon: <MessageCircle className="w-4 h-4" />, active: active === "whatsapp", group: "Sistema" },
  { label: "Configurações", href: "/dashboard/settings?role=admin", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Sistema" },
];

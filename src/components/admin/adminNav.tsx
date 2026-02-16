import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3, CreditCard, FileText, History, KeyRound, TrendingUp, UserCog } from "lucide-react";

export const getAdminNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview" },
  { label: "Relatórios", href: "/dashboard/admin/reports", icon: <TrendingUp className="w-4 h-4" />, active: active === "reports" },
  { label: "Usuários", href: "/dashboard/admin/users", icon: <UserCog className="w-4 h-4" />, active: active === "users" },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" />, active: active === "patients" },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors" },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" />, active: active === "clinics" },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" />, active: active === "appointments" },
  { label: "Planos", href: "/dashboard/admin/plans", icon: <CreditCard className="w-4 h-4" />, active: active === "plans" },
  { label: "Assinaturas", href: "/dashboard/admin/subscriptions", icon: <FileText className="w-4 h-4" />, active: active === "subscriptions" },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" />, active: active === "specialties" },
  { label: "Códigos de Convite", href: "/dashboard/admin/invite-codes", icon: <KeyRound className="w-4 h-4" />, active: active === "invite-codes" },
  { label: "Histórico", href: "/dashboard/admin/logs", icon: <History className="w-4 h-4" />, active: active === "logs" },
];

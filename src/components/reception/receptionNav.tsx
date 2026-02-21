import { Calendar, Users, CheckCircle, FileText, BarChart3, UserCog, SlidersHorizontal } from "lucide-react";

export const getReceptionNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview" },
  { label: "Agendas", href: "/dashboard/reception/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules" },
  { label: "Check-in", href: "/dashboard/reception/checkin", icon: <CheckCircle className="w-4 h-4" />, active: active === "checkin" },
  { label: "Pacientes", href: "/dashboard/reception/patients", icon: <Users className="w-4 h-4" />, active: active === "patients" },
  { label: "Convênios", href: "/dashboard/reception/billing", icon: <FileText className="w-4 h-4" />, active: active === "billing" },
  { label: "Configurações", href: "/dashboard/settings?role=receptionist", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings" },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" />, active: active === "profile" },
];

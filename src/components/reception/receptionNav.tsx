import { Calendar, Users, CheckCircle, FileText, BarChart3, UserCog, SlidersHorizontal, Bot } from "lucide-react";

export const getReceptionNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Assistente IA", href: "/dashboard/ai-assistant", icon: <Bot className="w-4 h-4" />, active: active === "ai-assistant", group: "Principal" },
  { label: "Agendas", href: "/dashboard/reception/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules", group: "Principal" },
  { label: "Check-in", href: "/dashboard/reception/checkin", icon: <CheckCircle className="w-4 h-4" />, active: active === "checkin", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/reception/patients", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Convênios", href: "/dashboard/reception/billing", icon: <FileText className="w-4 h-4" />, active: active === "billing", group: "Financeiro" },
  { label: "Configurações", href: "/dashboard/settings?role=receptionist", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

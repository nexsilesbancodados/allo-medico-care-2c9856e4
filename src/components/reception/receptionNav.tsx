import { Calendar, Users, CheckCircle, FileText, BarChart3, UserCog, SlidersHorizontal, Clock, MessageCircle, Phone, ClipboardList } from "lucide-react";

export const getReceptionNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Agendas", href: "/dashboard/reception/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/reception/waiting", icon: <Clock className="w-4 h-4" />, active: active === "waiting", group: "Principal" },
  { label: "Check-in", href: "/dashboard/reception/checkin", icon: <CheckCircle className="w-4 h-4" />, active: active === "checkin", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/reception/patients", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Chamadas", href: "/dashboard/reception/calls", icon: <Phone className="w-4 h-4" />, active: active === "calls", group: "Atendimento" },
  { label: "Prontuários", href: "/dashboard/reception/records", icon: <ClipboardList className="w-4 h-4" />, active: active === "records", group: "Documentos" },
  { label: "Convênios", href: "/dashboard/reception/billing", icon: <FileText className="w-4 h-4" />, active: active === "billing", group: "Financeiro" },
  { label: "Mensagens", href: "/dashboard/reception/messages", icon: <MessageCircle className="w-4 h-4" />, active: active === "messages", group: "Comunicação" },
  { label: "Configurações", href: "/dashboard/settings?role=receptionist", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

import { Calendar, Users, CheckCircle, FileText, BarChart3, UserCog, SlidersHorizontal, Clock, MessageCircle, Phone, ClipboardList, FileImage } from "lucide-react";

export const getReceptionNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard?role=receptionist", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Agendas", href: "/dashboard/reception/schedules?role=receptionist", icon: <Calendar className="w-4 h-4" />, active: active === "schedules", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/reception/waiting?role=receptionist", icon: <Clock className="w-4 h-4" />, active: active === "waiting", group: "Principal" },
  { label: "Check-in", href: "/dashboard/reception/checkin?role=receptionist", icon: <CheckCircle className="w-4 h-4" />, active: active === "checkin", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/reception/patients?role=receptionist", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Chamadas", href: "/dashboard/reception/calls?role=receptionist", icon: <Phone className="w-4 h-4" />, active: active === "calls", group: "Atendimento" },
  { label: "Solicitar Laudo", href: "/dashboard/reception/exam-request?role=receptionist", icon: <FileImage className="w-4 h-4" />, active: active === "exam-request", group: "Telelaudo" },
  { label: "Prontuários", href: "/dashboard/reception/records?role=receptionist", icon: <ClipboardList className="w-4 h-4" />, active: active === "records", group: "Documentos" },
  { label: "Convênios", href: "/dashboard/reception/billing?role=receptionist", icon: <FileText className="w-4 h-4" />, active: active === "billing", group: "Financeiro" },
  { label: "Mensagens", href: "/dashboard/reception/messages?role=receptionist", icon: <MessageCircle className="w-4 h-4" />, active: active === "messages", group: "Comunicação" },
  { label: "Configurações", href: "/dashboard/settings?role=receptionist", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Perfil", href: "/dashboard/profile?role=receptionist", icon: <UserCog className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

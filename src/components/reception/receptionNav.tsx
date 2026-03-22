import { Calendar, Users, CheckCircle, FileText, BarChart3, UserCog, SlidersHorizontal, Clock, MessageCircle, Phone, ClipboardList, FileImage } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getReceptionNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard?role=receptionist", icon: <NavIcon icon={<BarChart3 className="w-3.5 h-3.5" />} color="blue" />, active: active === "overview", group: "Principal" },
  { label: "Agendas", href: "/dashboard/reception/schedules?role=receptionist", icon: <NavIcon icon={<Calendar className="w-3.5 h-3.5" />} color="cyan" />, active: active === "schedules", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/reception/waiting?role=receptionist", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="orange" />, active: active === "waiting", group: "Principal" },
  { label: "Check-in", href: "/dashboard/reception/checkin?role=receptionist", icon: <NavIcon icon={<CheckCircle className="w-3.5 h-3.5" />} color="green" />, active: active === "checkin", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/reception/patients?role=receptionist", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="blue" />, active: active === "patients", group: "Atendimento" },
  { label: "Chamadas", href: "/dashboard/reception/calls?role=receptionist", icon: <NavIcon icon={<Phone className="w-3.5 h-3.5" />} color="amber" />, active: active === "calls", group: "Atendimento" },
  { label: "Solicitar Laudo", href: "/dashboard/reception/exam-request?role=receptionist", icon: <NavIcon icon={<FileImage className="w-3.5 h-3.5" />} color="purple" />, active: active === "exam-request", group: "Telelaudo" },
  { label: "Prontuários", href: "/dashboard/reception/records?role=receptionist", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="emerald" />, active: active === "records", group: "Documentos" },
  { label: "Convênios", href: "/dashboard/reception/billing?role=receptionist", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="green" />, active: active === "billing", group: "Financeiro" },
  { label: "Mensagens", href: "/dashboard/reception/messages?role=receptionist", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="cyan" />, active: active === "messages", group: "Comunicação" },
  { label: "Configurações", href: "/dashboard/settings?role=receptionist", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Perfil", href: "/dashboard/profile?role=receptionist", icon: <NavIcon icon={<UserCog className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Conta" },
];

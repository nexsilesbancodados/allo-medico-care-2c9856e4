import { BarChart3, Stethoscope, Calendar, Users, Clock, FileText, ClipboardList, DollarSign, Settings, SlidersHorizontal } from "lucide-react";

export const getClinicNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard?role=clinic", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview", group: "Principal" },
  { label: "Médicos", href: "/dashboard/clinic/doctors?role=clinic", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors", group: "Principal" },
  { label: "Agendamentos", href: "/dashboard/clinic/schedules?role=clinic", icon: <Calendar className="w-4 h-4" />, active: active === "schedules", group: "Principal" },
  { label: "Pacientes", href: "/dashboard/clinic/patients?role=clinic", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Sala de Espera", href: "/dashboard/clinic/waiting-room?role=clinic", icon: <Clock className="w-4 h-4" />, active: active === "waiting-room", group: "Atendimento" },
  { label: "Solicitar Laudo", href: "/dashboard/clinic/exam-request?role=clinic", icon: <FileText className="w-4 h-4" />, active: active === "exam-request", group: "Telelaudo" },
  { label: "Meus Laudos", href: "/dashboard/clinic/my-exams?role=clinic", icon: <ClipboardList className="w-4 h-4" />, active: active === "my-exams", group: "Telelaudo" },
  { label: "Financeiro", href: "/dashboard/clinic/finance?role=clinic", icon: <DollarSign className="w-4 h-4" />, active: active === "finance", group: "Gestão" },
  { label: "Relatórios", href: "/dashboard/clinic/reports?role=clinic", icon: <FileText className="w-4 h-4" />, active: active === "reports", group: "Gestão" },
  { label: "Perfil", href: "/dashboard/profile?role=clinic", icon: <Settings className="w-4 h-4" />, active: active === "profile", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=clinic", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
];

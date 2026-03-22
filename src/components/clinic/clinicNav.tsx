import { BarChart3, Stethoscope, Calendar, Users, Clock, FileText, ClipboardList, DollarSign, Settings, SlidersHorizontal } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getClinicNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard?role=clinic", icon: <NavIcon icon={<BarChart3 className="w-3.5 h-3.5" />} color="blue" />, active: active === "overview", group: "Principal" },
  { label: "Médicos", href: "/dashboard/clinic/doctors?role=clinic", icon: <NavIcon icon={<Stethoscope className="w-3.5 h-3.5" />} color="emerald" />, active: active === "doctors", group: "Principal" },
  { label: "Agendamentos", href: "/dashboard/clinic/schedules?role=clinic", icon: <NavIcon icon={<Calendar className="w-3.5 h-3.5" />} color="cyan" />, active: active === "schedules", group: "Principal" },
  { label: "Pacientes", href: "/dashboard/clinic/patients?role=clinic", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="blue" />, active: active === "patients", group: "Atendimento" },
  { label: "Sala de Espera", href: "/dashboard/clinic/waiting-room?role=clinic", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="orange" />, active: active === "waiting-room", group: "Atendimento" },
  { label: "Solicitar Laudo", href: "/dashboard/clinic/exam-request?role=clinic", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="purple" />, active: active === "exam-request", group: "Telelaudo" },
  { label: "Meus Laudos", href: "/dashboard/clinic/my-exams?role=clinic", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="emerald" />, active: active === "my-exams", group: "Telelaudo" },
  { label: "Financeiro", href: "/dashboard/clinic/finance?role=clinic", icon: <NavIcon icon={<DollarSign className="w-3.5 h-3.5" />} color="green" />, active: active === "finance", group: "Gestão" },
  { label: "Relatórios", href: "/dashboard/clinic/reports?role=clinic", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="cyan" />, active: active === "reports", group: "Gestão" },
  { label: "Perfil", href: "/dashboard/profile?role=clinic", icon: <NavIcon icon={<Settings className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=clinic", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Conta" },
];

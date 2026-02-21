import { Calendar, FileText, Users, DollarSign, Settings, User, FileBadge, Clock, History, CalendarDays, Upload, MessageCircle, SlidersHorizontal } from "lucide-react";

export const getDoctorNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <Calendar className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Calendário", href: "/dashboard/doctor/calendar", icon: <CalendarDays className="w-4 h-4" />, active: active === "calendar", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/doctor/waiting-room", icon: <Clock className="w-4 h-4" />, active: active === "waiting-room", group: "Principal" },
  { label: "Consultas", href: "/dashboard/doctor/consultations", icon: <History className="w-4 h-4" />, active: active === "consultations", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Chat", href: "/dashboard/chat", icon: <MessageCircle className="w-4 h-4" />, active: active === "chat", group: "Atendimento" },
  { label: "Exames", href: "/dashboard/doctor/documents", icon: <Upload className="w-4 h-4" />, active: active === "documents", group: "Documentos" },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, active: active === "prescriptions", group: "Documentos" },
  { label: "Atestados", href: "/dashboard/certificates", icon: <FileBadge className="w-4 h-4" />, active: active === "certificates", group: "Documentos" },
  { label: "Ganhos", href: "/dashboard/earnings", icon: <DollarSign className="w-4 h-4" />, active: active === "earnings", group: "Financeiro" },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" />, active: active === "availability", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

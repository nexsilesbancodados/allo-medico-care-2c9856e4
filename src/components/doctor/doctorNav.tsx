import { Calendar, FileText, Users, DollarSign, Settings, User, FileBadge, Clock, History, CalendarDays, Upload, MessageCircle, SlidersHorizontal, Zap, RefreshCw } from "lucide-react";

export const getDoctorNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <Calendar className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Plantão 24h", href: "/dashboard/doctor/on-duty?role=doctor", icon: <Zap className="w-4 h-4" />, active: active === "on-duty", group: "Principal" },
  { label: "Calendário", href: "/dashboard/doctor/calendar?role=doctor", icon: <CalendarDays className="w-4 h-4" />, active: active === "calendar", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/doctor/waiting-room?role=doctor", icon: <Clock className="w-4 h-4" />, active: active === "waiting-room", group: "Principal" },
  { label: "Consultas", href: "/dashboard/doctor/consultations?role=doctor", icon: <History className="w-4 h-4" />, active: active === "consultations", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/patients?role=doctor", icon: <Users className="w-4 h-4" />, active: active === "patients", group: "Atendimento" },
  { label: "Chat", href: "/dashboard/chat?role=doctor", icon: <MessageCircle className="w-4 h-4" />, active: active === "chat", group: "Atendimento" },
  { label: "Renovações", href: "/dashboard/doctor/renewal-queue?role=doctor", icon: <RefreshCw className="w-4 h-4" />, active: active === "renewal-queue", group: "Documentos" },
  { label: "Exames", href: "/dashboard/doctor/documents?role=doctor", icon: <Upload className="w-4 h-4" />, active: active === "documents", group: "Documentos" },
  { label: "Receitas", href: "/dashboard/prescriptions?role=doctor", icon: <FileText className="w-4 h-4" />, active: active === "prescriptions", group: "Documentos" },
  { label: "Atestados", href: "/dashboard/certificates?role=doctor", icon: <FileBadge className="w-4 h-4" />, active: active === "certificates", group: "Documentos" },
  
  { label: "Ganhos", href: "/dashboard/earnings?role=doctor", icon: <DollarSign className="w-4 h-4" />, active: active === "earnings", group: "Financeiro" },
  { label: "Disponibilidade", href: "/dashboard/availability?role=doctor", icon: <Settings className="w-4 h-4" />, active: active === "availability", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

import { Calendar, FileText, Users, DollarSign, Settings, User, FileBadge, Clock, History, CalendarDays, Upload, MessageCircle, SlidersHorizontal, Zap, RefreshCw, CreditCard, Pill } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getDoctorNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <NavIcon icon={<Calendar className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Plantão 24h", href: "/dashboard/doctor/on-duty?role=doctor", icon: <NavIcon icon={<Zap className="w-3.5 h-3.5" />} color="amber" />, active: active === "on-duty", group: "Principal" },
  { label: "Calendário", href: "/dashboard/doctor/calendar?role=doctor", icon: <NavIcon icon={<CalendarDays className="w-3.5 h-3.5" />} color="cyan" />, active: active === "calendar", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/doctor/waiting-room?role=doctor", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="orange" />, active: active === "waiting-room", group: "Principal" },
  { label: "Consultas", href: "/dashboard/doctor/consultations?role=doctor", icon: <NavIcon icon={<History className="w-3.5 h-3.5" />} color="emerald" />, active: active === "consultations", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/patients?role=doctor", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="blue" />, active: active === "patients", group: "Atendimento" },
  { label: "Chat", href: "/dashboard/chat?role=doctor", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="cyan" />, active: active === "chat", group: "Atendimento" },
  { label: "Renovações", href: "/dashboard/doctor/renewal-queue?role=doctor", icon: <NavIcon icon={<RefreshCw className="w-3.5 h-3.5" />} color="green" />, active: active === "renewal-queue", group: "Documentos" },
  { label: "Exames", href: "/dashboard/doctor/documents?role=doctor", icon: <NavIcon icon={<Upload className="w-3.5 h-3.5" />} color="purple" />, active: active === "documents", group: "Documentos" },
  { label: "Receitas", href: "/dashboard/prescriptions?role=doctor", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="emerald" />, active: active === "prescriptions", group: "Documentos" },
  { label: "Receituário", href: "/dashboard/doctor/simple-prescription?role=doctor", icon: <NavIcon icon={<Pill className="w-3.5 h-3.5" />} color="rose" />, active: active === "simple-prescription", group: "Documentos" },
  { label: "Atestados", href: "/dashboard/certificates?role=doctor", icon: <NavIcon icon={<FileBadge className="w-3.5 h-3.5" />} color="blue" />, active: active === "certificates", group: "Documentos" },
  

  { label: "Ganhos", href: "/dashboard/earnings?role=doctor", icon: <NavIcon icon={<DollarSign className="w-3.5 h-3.5" />} color="green" />, active: active === "earnings", group: "Financeiro" },
  { label: "Carteira", href: "/dashboard/doctor/wallet?role=doctor", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="emerald" />, active: active === "wallet", group: "Financeiro" },
  { label: "Disponibilidade", href: "/dashboard/availability?role=doctor", icon: <NavIcon icon={<Settings className="w-3.5 h-3.5" />} color="slate" />, active: active === "availability", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <NavIcon icon={<User className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Conta" },
];

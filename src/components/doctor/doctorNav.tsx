import { Calendar, FileText, Users, DollarSign, Settings, User, FileBadge, Clock, History } from "lucide-react";

export const getDoctorNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <Calendar className="w-4 h-4" />, active: active === "home" },
  { label: "Consultas", href: "/dashboard/doctor/consultations", icon: <History className="w-4 h-4" />, active: active === "consultations" },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" />, active: active === "patients" },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, active: active === "prescriptions" },
  { label: "Atestados", href: "/dashboard/certificates", icon: <FileBadge className="w-4 h-4" />, active: active === "certificates" },
  { label: "Ganhos", href: "/dashboard/earnings", icon: <DollarSign className="w-4 h-4" />, active: active === "earnings" },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" />, active: active === "availability" },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile" },
];

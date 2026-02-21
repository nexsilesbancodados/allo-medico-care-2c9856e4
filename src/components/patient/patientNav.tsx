import { Home, Calendar, Search, Clock, MessageCircle, Headphones, ClipboardList, Heart, Smile, Upload, CreditCard, Users, SlidersHorizontal, User } from "lucide-react";

export const getPatientNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=patient", icon: <Home className="w-4 h-4" />, active: active === "home" },
  { label: "Agendar", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" />, active: active === "schedule" },
  { label: "Buscar Médicos", href: "/dashboard/doctors", icon: <Search className="w-4 h-4" />, active: active === "doctors" },
  { label: "Consultas", href: "/dashboard/appointments", icon: <Clock className="w-4 h-4" />, active: active === "appointments" },
  { label: "Chat", href: "/dashboard/chat", icon: <MessageCircle className="w-4 h-4" />, active: active === "chat" },
  { label: "Suporte", href: "/dashboard/patient/support", icon: <Headphones className="w-4 h-4" />, active: active === "support" },
  { label: "Prontuário", href: "/dashboard/medical-records", icon: <ClipboardList className="w-4 h-4" />, active: active === "medical-records" },
  { label: "Minha Saúde", href: "/dashboard/patient/health", icon: <Heart className="w-4 h-4" />, active: active === "health" },
  { label: "Diário", href: "/dashboard/patient/diary", icon: <Smile className="w-4 h-4" />, active: active === "diary" },
  { label: "Meus Exames", href: "/dashboard/patient/documents", icon: <Upload className="w-4 h-4" />, active: active === "documents" },
  { label: "Pagamentos", href: "/dashboard/payment-history", icon: <CreditCard className="w-4 h-4" />, active: active === "payments" },
  { label: "Dependentes", href: "/dashboard/patient/dependents", icon: <Users className="w-4 h-4" />, active: active === "dependents" },
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings" },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile" },
];

import { Home, Calendar, Search, Clock, MessageCircle, Headphones, ClipboardList, Heart, Smile, Upload, CreditCard, Users, SlidersHorizontal, User } from "lucide-react";

export const getPatientNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=patient", icon: <Home className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Agendar", href: "/dashboard/schedule?role=patient", icon: <Calendar className="w-4 h-4" />, active: active === "schedule", group: "Principal" },
  { label: "Buscar Médicos", href: "/dashboard/doctors?role=patient", icon: <Search className="w-4 h-4" />, active: active === "doctors", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments?role=patient", icon: <Clock className="w-4 h-4" />, active: active === "appointments", group: "Principal" },
  { label: "Chat", href: "/dashboard/chat?role=patient", icon: <MessageCircle className="w-4 h-4" />, active: active === "chat", group: "Comunicação" },
  { label: "Suporte", href: "/dashboard/patient/support?role=patient", icon: <Headphones className="w-4 h-4" />, active: active === "support", group: "Comunicação" },
  { label: "Prontuário", href: "/dashboard/medical-records?role=patient", icon: <ClipboardList className="w-4 h-4" />, active: active === "health", group: "Saúde" },
  { label: "Minha Saúde", href: "/dashboard/patient/health?role=patient", icon: <Heart className="w-4 h-4" />, active: active === "health", group: "Saúde" },
  { label: "Diário", href: "/dashboard/patient/diary?role=patient", icon: <Smile className="w-4 h-4" />, active: active === "diary", group: "Saúde" },
  { label: "Meus Exames", href: "/dashboard/patient/documents?role=patient", icon: <Upload className="w-4 h-4" />, active: active === "documents", group: "Saúde" },
  { label: "Pagamentos", href: "/dashboard/payment-history?role=patient", icon: <CreditCard className="w-4 h-4" />, active: active === "payments", group: "Conta" },
  { label: "Dependentes", href: "/dashboard/patient/dependents?role=patient", icon: <Users className="w-4 h-4" />, active: active === "dependents", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=patient", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

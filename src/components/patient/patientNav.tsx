import { Home, Calendar, Search, Clock, MessageCircle, Headphones, ClipboardList, Heart, Smile, Upload, CreditCard, Users, SlidersHorizontal, User, Bot } from "lucide-react";

export const getPatientNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=patient", icon: <Home className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Assistente IA", href: "/dashboard/ai-assistant", icon: <Bot className="w-4 h-4" />, active: active === "ai-assistant", group: "Principal" },
  { label: "Agendar", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" />, active: active === "schedule", group: "Principal" },
  { label: "Buscar Médicos", href: "/dashboard/doctors", icon: <Search className="w-4 h-4" />, active: active === "doctors", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments", icon: <Clock className="w-4 h-4" />, active: active === "appointments", group: "Principal" },
  { label: "Chat", href: "/dashboard/chat", icon: <MessageCircle className="w-4 h-4" />, active: active === "chat", group: "Comunicação" },
  { label: "Suporte", href: "/dashboard/patient/support", icon: <Headphones className="w-4 h-4" />, active: active === "support", group: "Comunicação" },
  { label: "Prontuário", href: "/dashboard/medical-records", icon: <ClipboardList className="w-4 h-4" />, active: active === "health", group: "Saúde" },
  { label: "Minha Saúde", href: "/dashboard/patient/health", icon: <Heart className="w-4 h-4" />, active: active === "health", group: "Saúde" },
  { label: "Diário", href: "/dashboard/patient/diary", icon: <Smile className="w-4 h-4" />, active: active === "diary", group: "Saúde" },
  { label: "Meus Exames", href: "/dashboard/patient/documents", icon: <Upload className="w-4 h-4" />, active: active === "documents", group: "Saúde" },
  { label: "Pagamentos", href: "/dashboard/payment-history", icon: <CreditCard className="w-4 h-4" />, active: active === "payments", group: "Conta" },
  { label: "Dependentes", href: "/dashboard/patient/dependents", icon: <Users className="w-4 h-4" />, active: active === "dependents", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

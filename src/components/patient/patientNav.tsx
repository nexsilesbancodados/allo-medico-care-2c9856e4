import {
  Home, Clock, MessageCircle, CreditCard, User, Search, Zap,
  SlidersHorizontal, Shield, Heart, FileText, Upload,
  ClipboardList, Users, BookOpen, Headphones, Bell
} from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getPatientNav = (active: string) => [
  // ── Bottom bar (first 5 = bottom nav) ──
  { label: "Início", href: "/dashboard?role=patient", icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="blue" />, active: active === "appointments", group: "Principal" },
  { label: "Urgência", href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Zap className="w-3.5 h-3.5" />} color="amber" />, active: active === "urgent-care", group: "Principal" },
  { label: "Chat", href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="blue" />, active: active === "chat", group: "Principal" },
  { label: "Perfil", href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<User className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Principal" },

  // ── Consultas ──
  { label: "Agendar", href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<Search className="w-3.5 h-3.5" />} color="cyan" />, active: active === "schedule" || active === "doctors", group: "Consultas" },
  { label: "Notificações", href: "/dashboard/notifications?role=patient", icon: <NavIcon icon={<Bell className="w-3.5 h-3.5" />} color="blue" />, active: active === "notifications", group: "Consultas" },
  { label: "Pagamentos", href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="green" />, active: active === "payments", group: "Consultas" },

  // ── Saúde Digital ──
  { label: "Minha Saúde", href: "/dashboard/patient/health?role=patient", icon: <NavIcon icon={<Heart className="w-3.5 h-3.5" />} color="rose" />, active: active === "health", group: "Saúde Digital" },
  { label: "Receitas", href: "/dashboard/history?role=patient", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="emerald" />, active: active === "history", group: "Saúde Digital" },
  { label: "Exames", href: "/dashboard/patient/exam-results?role=patient", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="purple" />, active: active === "exam-results", group: "Saúde Digital" },
  { label: "Enviar Exames", href: "/dashboard/patient/documents?role=patient", icon: <NavIcon icon={<Upload className="w-3.5 h-3.5" />} color="cyan" />, active: active === "documents", group: "Saúde Digital" },
  { label: "Renovar Receita", href: "/dashboard/prescription-renewal?role=patient", icon: <NavIcon icon={<BookOpen className="w-3.5 h-3.5" />} color="emerald" />, active: active === "renewal", group: "Saúde Digital" },

  // ── Perfil Clínico ──
  { label: "Dependentes", href: "/dashboard/patient/dependents?role=patient", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="blue" />, active: active === "dependents", group: "Perfil Clínico" },

  // ── Suporte ──
  { label: "Suporte", href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<Headphones className="w-3.5 h-3.5" />} color="emerald" />, active: active === "support", group: "Suporte" },

  // ── Segurança ──
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Segurança" },
  { label: "Privacidade", href: "/dashboard/settings?role=patient&tab=privacy", icon: <NavIcon icon={<Shield className="w-3.5 h-3.5" />} color="amber" />, active: active === "privacy", group: "Segurança" },
];

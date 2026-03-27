import {
  Home, Search, Clock, Zap, User, SlidersHorizontal,
  CreditCard, MessageCircle, Headphones, Heart, FileText,
  Upload, ClipboardList, Users, Shield, BookOpen
} from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getPatientNav = (active: string) => [
  // ── Bottom bar (first 5 = bottom nav) ──
  { label: "Início", href: "/dashboard?role=patient", icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Agendar", href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<Search className="w-3.5 h-3.5" />} color="cyan" />, active: active === "schedule" || active === "doctors", group: "Principal" },
  { label: "Urgência", href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Zap className="w-3.5 h-3.5" />} color="amber" />, active: active === "urgent-care", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="blue" />, active: active === "appointments", group: "Principal" },

  // ── Saúde Digital ──
  { label: "Minha Saúde", href: "/dashboard/patient/health?role=patient", icon: <NavIcon icon={<Heart className="w-3.5 h-3.5" />} color="rose" />, active: active === "health", group: "Saúde Digital" },
  { label: "Receitas", href: "/dashboard/history?role=patient", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="emerald" />, active: active === "history", group: "Saúde Digital" },
  { label: "Exames", href: "/dashboard/patient/exam-results?role=patient", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="violet" />, active: active === "exam-results", group: "Saúde Digital" },
  { label: "Enviar Exames", href: "/dashboard/patient/documents?role=patient", icon: <NavIcon icon={<Upload className="w-3.5 h-3.5" />} color="sky" />, active: active === "documents", group: "Saúde Digital" },
  { label: "Renovar Receita", href: "/dashboard/prescription-renewal?role=patient", icon: <NavIcon icon={<BookOpen className="w-3.5 h-3.5" />} color="teal" />, active: active === "renewal", group: "Saúde Digital" },

  // ── Perfil Clínico ──
  { label: "Meu Perfil", href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<User className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Perfil Clínico" },
  { label: "Dependentes", href: "/dashboard/patient/dependents?role=patient", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="indigo" />, active: active === "dependents", group: "Perfil Clínico" },

  // ── Financeiro & Suporte ──
  { label: "Pagamentos", href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="green" />, active: active === "payments", group: "Financeiro" },
  { label: "Chat", href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="blue" />, active: active === "chat", group: "Financeiro" },
  { label: "Suporte", href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<Headphones className="w-3.5 h-3.5" />} color="emerald" />, active: active === "support", group: "Financeiro" },

  // ── Segurança ──
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Segurança" },
  { label: "Privacidade", href: "/dashboard/settings?role=patient&tab=privacy", icon: <NavIcon icon={<Shield className="w-3.5 h-3.5" />} color="amber" />, active: active === "privacy", group: "Segurança" },
];

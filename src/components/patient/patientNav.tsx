import {
  Home, Search, Clock, Zap, User, SlidersHorizontal,
  CreditCard, MessageCircle, Headphones
} from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getPatientNav = (active: string) => [
  // ── Bottom bar (first 5 = bottom nav) ──
  { label: "Início", href: "/dashboard?role=patient", icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Agendar", href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<Search className="w-3.5 h-3.5" />} color="cyan" />, active: active === "schedule" || active === "doctors", group: "Principal" },
  { label: "Urgência", href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Zap className="w-3.5 h-3.5" />} color="amber" />, active: active === "urgent-care", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="blue" />, active: active === "appointments", group: "Principal" },
  { label: "Comprar", href: "/dashboard/plans?role=patient", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="green" />, active: active === "plans", group: "Principal" },

  // ── Comunicação ──
  { label: "Chat", href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="blue" />, active: active === "chat", group: "Comunicação" },
  { label: "Suporte", href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<Headphones className="w-3.5 h-3.5" />} color="emerald" />, active: active === "support", group: "Comunicação" },

  // ── Conta ──
  { label: "Pagamentos", href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="green" />, active: active === "payments", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<User className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Conta" },
];

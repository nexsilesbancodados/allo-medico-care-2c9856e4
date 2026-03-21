import { ClipboardList, LayoutDashboard, FileText, Settings, User, SlidersHorizontal, BarChart2, DollarSign, CreditCard } from "lucide-react";

export const getLaudistaNav = (active: string) => [
  { label: "Início", href: "/dashboard/laudista?role=doctor", icon: <LayoutDashboard className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Fila de Exames", href: "/dashboard/laudista/queue?role=doctor", icon: <ClipboardList className="w-4 h-4" />, active: active === "queue", group: "Principal" },
  { label: "Meus Laudos", href: "/dashboard/laudista/my-reports?role=doctor", icon: <FileText className="w-4 h-4" />, active: active === "my-reports", group: "Principal" },
  { label: "Templates", href: "/dashboard/laudista/templates?role=doctor", icon: <FileText className="w-4 h-4" />, active: active === "templates", group: "Ferramentas" },
  { label: "Estatísticas", href: "/dashboard/laudista/stats?role=doctor", icon: <BarChart2 className="w-4 h-4" />, active: active === "stats", group: "Ferramentas" },
  { label: "Ganhos", href: "/dashboard/laudista/earnings?role=doctor", icon: <DollarSign className="w-4 h-4" />, active: active === "earnings", group: "Financeiro" },
  { label: "Carteira", href: "/dashboard/laudista/wallet?role=doctor", icon: <CreditCard className="w-4 h-4" />, active: active === "wallet", group: "Financeiro" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <SlidersHorizontal className="w-4 h-4" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

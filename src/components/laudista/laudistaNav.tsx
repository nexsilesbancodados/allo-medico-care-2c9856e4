import { ClipboardList, LayoutDashboard, FileText, User, BarChart2, Wallet } from "lucide-react";

export const getLaudistaNav = (active: string) => [
  { label: "Início", href: "/dashboard/laudista?role=doctor", icon: <LayoutDashboard className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Fila de Exames", href: "/dashboard/laudista/queue?role=doctor", icon: <ClipboardList className="w-4 h-4" />, active: active === "queue", group: "Principal" },
  { label: "Meus Laudos", href: "/dashboard/laudista/my-reports?role=doctor", icon: <FileText className="w-4 h-4" />, active: active === "my-reports", group: "Principal" },
  { label: "Estatísticas", href: "/dashboard/laudista/stats?role=doctor", icon: <BarChart2 className="w-4 h-4" />, active: active === "stats", group: "Ferramentas" },
  { label: "Financeiro", href: "/dashboard/laudista/financeiro?role=doctor", icon: <Wallet className="w-4 h-4" />, active: active === "financeiro", group: "Financeiro" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <User className="w-4 h-4" />, active: active === "profile", group: "Conta" },
];

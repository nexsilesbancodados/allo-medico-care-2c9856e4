import { ClipboardList, LayoutDashboard, FileText, User, Wallet } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getLaudistaNav = (active: string) => [
  { label: "Início", href: "/dashboard/laudista?role=laudista", icon: <NavIcon icon={<LayoutDashboard className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Fila de Exames", href: "/dashboard/laudista/queue?role=laudista", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="cyan" />, active: active === "queue", group: "Principal" },
  { label: "Meus Laudos", href: "/dashboard/laudista/my-reports?role=laudista", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="emerald" />, active: active === "my-reports", group: "Principal" },
  { label: "Financeiro", href: "/dashboard/laudista/financeiro?role=laudista", icon: <NavIcon icon={<Wallet className="w-3.5 h-3.5" />} color="green" />, active: active === "financeiro", group: "Financeiro" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=laudista", icon: <NavIcon icon={<User className="w-3.5 h-3.5" />} color="blue" />, active: active === "profile", group: "Conta" },
];

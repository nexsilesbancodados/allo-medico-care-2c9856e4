import { NavItem } from "@/components/dashboards/DashboardLayout";
import { ShoppingBag, Package, Factory, DollarSign, LayoutDashboard, Glasses } from "lucide-react";

export const opticianNav: NavItem[] = [
  { label: "Visão Geral", icon: LayoutDashboard, tab: "overview" },
  { label: "Pedidos", icon: ShoppingBag, tab: "orders" },
  { label: "Catálogo", icon: Glasses, tab: "catalog" },
  { label: "Estoque", icon: Package, tab: "stock" },
  { label: "Produção", icon: Factory, tab: "production" },
  { label: "Financeiro", icon: DollarSign, tab: "financial" },
];

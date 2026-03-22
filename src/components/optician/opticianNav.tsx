import { ShoppingBag, Package, Factory, DollarSign, LayoutDashboard, Glasses } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getOpticianNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard/optician?role=optician", icon: <NavIcon icon={<LayoutDashboard className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Pedidos", href: "/dashboard/optician/orders?role=optician", icon: <NavIcon icon={<ShoppingBag className="w-3.5 h-3.5" />} color="amber" />, active: active === "orders", group: "Principal" },
  { label: "Catálogo", href: "/dashboard/optician/catalog?role=optician", icon: <NavIcon icon={<Glasses className="w-3.5 h-3.5" />} color="purple" />, active: active === "catalog", group: "Produtos" },
  { label: "Estoque", href: "/dashboard/optician/stock?role=optician", icon: <NavIcon icon={<Package className="w-3.5 h-3.5" />} color="cyan" />, active: active === "stock", group: "Produtos" },
  { label: "Produção", href: "/dashboard/optician/production?role=optician", icon: <NavIcon icon={<Factory className="w-3.5 h-3.5" />} color="orange" />, active: active === "production", group: "Operação" },
  { label: "Financeiro", href: "/dashboard/optician/financial?role=optician", icon: <NavIcon icon={<DollarSign className="w-3.5 h-3.5" />} color="green" />, active: active === "financial", group: "Operação" },
];

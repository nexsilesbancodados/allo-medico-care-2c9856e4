import { ShoppingBag, Package, Factory, DollarSign, LayoutDashboard, Glasses } from "lucide-react";

export const getOpticianNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard/optician?role=optician", icon: <LayoutDashboard className="w-4 h-4" />, active: active === "home", group: "Principal" },
  { label: "Pedidos", href: "/dashboard/optician/orders?role=optician", icon: <ShoppingBag className="w-4 h-4" />, active: active === "orders", group: "Principal" },
  { label: "Catálogo", href: "/dashboard/optician/catalog?role=optician", icon: <Glasses className="w-4 h-4" />, active: active === "catalog", group: "Produtos" },
  { label: "Estoque", href: "/dashboard/optician/stock?role=optician", icon: <Package className="w-4 h-4" />, active: active === "stock", group: "Produtos" },
  { label: "Produção", href: "/dashboard/optician/production?role=optician", icon: <Factory className="w-4 h-4" />, active: active === "production", group: "Operação" },
  { label: "Financeiro", href: "/dashboard/optician/financial?role=optician", icon: <DollarSign className="w-4 h-4" />, active: active === "financial", group: "Operação" },
];

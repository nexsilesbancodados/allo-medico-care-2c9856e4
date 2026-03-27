import { NavIcon } from "@/components/ui/nav-icon";
import { Home } from "lucide-react";

/** @deprecated Reception panel removed — stub kept for build compatibility */
export const getReceptionNav = (_active: string) => [
  { label: "Início", href: "/dashboard", icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />, active: false, group: "Principal" },
];

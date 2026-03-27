import { NavIcon } from "@/components/ui/nav-icon";
import { Home } from "lucide-react";

export const getOpticianNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=optician", icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />, active: active === "home", group: "Principal" },
];
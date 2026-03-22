import { Users, Stethoscope, Building2, Calendar, Shield, CreditCard, FileText, History, KeyRound, TrendingUp, UserCog, UserCheck, Star, MessageCircle, SlidersHorizontal, Video, LayoutGrid, Wallet, Tag, ClipboardList } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getAdminNav = (active: string) => [
  { label: "Centro de Painéis", href: "/dashboard/admin/panel-center?role=admin", icon: <NavIcon icon={<LayoutGrid className="w-3.5 h-3.5" />} color="blue" />, active: active === "overview" || active === "panel-center", group: "Principal" },
  { label: "Ao Vivo", href: "/dashboard/admin/live?role=admin", icon: <NavIcon icon={<Video className="w-3.5 h-3.5" />} color="rose" />, active: active === "live", group: "Principal" },
  { label: "Financeiro", href: "/dashboard/admin/financial?role=admin", icon: <NavIcon icon={<Wallet className="w-3.5 h-3.5" />} color="green" />, active: active === "financial", group: "Principal" },
  { label: "Relatórios", href: "/dashboard/admin/reports?role=admin", icon: <NavIcon icon={<TrendingUp className="w-3.5 h-3.5" />} color="cyan" />, active: active === "reports", group: "Principal" },
  { label: "NPS", href: "/dashboard/admin/nps?role=admin", icon: <NavIcon icon={<Star className="w-3.5 h-3.5" />} color="amber" />, active: active === "nps", group: "Monitoramento" },
  { label: "Aprovações", href: "/dashboard/admin/approvals?role=admin", icon: <NavIcon icon={<UserCheck className="w-3.5 h-3.5" />} color="emerald" />, active: active === "approvals", group: "Monitoramento" },
  { label: "Solicitações Médicos", href: "/dashboard/admin/doctor-applications?role=admin", icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="purple" />, active: active === "doctor-applications", group: "Monitoramento" },
  { label: "Usuários", href: "/dashboard/admin/users?role=admin", icon: <NavIcon icon={<UserCog className="w-3.5 h-3.5" />} color="blue" />, active: active === "users", group: "Gestão" },
  { label: "Pacientes", href: "/dashboard/admin/patients?role=admin", icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="cyan" />, active: active === "patients", group: "Gestão" },
  { label: "Médicos", href: "/dashboard/admin/doctors?role=admin", icon: <NavIcon icon={<Stethoscope className="w-3.5 h-3.5" />} color="emerald" />, active: active === "doctors", group: "Gestão" },
  { label: "Clínicas", href: "/dashboard/admin/clinics?role=admin", icon: <NavIcon icon={<Building2 className="w-3.5 h-3.5" />} color="orange" />, active: active === "clinics", group: "Gestão" },
  { label: "Consultas", href: "/dashboard/admin/appointments?role=admin", icon: <NavIcon icon={<Calendar className="w-3.5 h-3.5" />} color="blue" />, active: active === "appointments", group: "Operações" },
  { label: "Planos", href: "/dashboard/admin/plans?role=admin", icon: <NavIcon icon={<CreditCard className="w-3.5 h-3.5" />} color="green" />, active: active === "plans", group: "Operações" },
  { label: "Assinaturas", href: "/dashboard/admin/subscriptions?role=admin", icon: <NavIcon icon={<FileText className="w-3.5 h-3.5" />} color="purple" />, active: active === "subscriptions", group: "Operações" },
  { label: "Especialidades", href: "/dashboard/admin/specialties?role=admin", icon: <NavIcon icon={<Shield className="w-3.5 h-3.5" />} color="cyan" />, active: active === "specialties", group: "Operações" },
  { label: "Códigos de Convite", href: "/dashboard/admin/invite-codes?role=admin", icon: <NavIcon icon={<KeyRound className="w-3.5 h-3.5" />} color="amber" />, active: active === "invite-codes", group: "Sistema" },
  { label: "Cupons", href: "/dashboard/admin/coupons?role=admin", icon: <NavIcon icon={<Tag className="w-3.5 h-3.5" />} color="orange" />, active: active === "coupons", group: "Operações" },
  { label: "Histórico", href: "/dashboard/admin/logs?role=admin", icon: <NavIcon icon={<History className="w-3.5 h-3.5" />} color="slate" />, active: active === "logs", group: "Sistema" },
  { label: "WhatsApp", href: "/dashboard/admin/whatsapp?role=admin", icon: <NavIcon icon={<MessageCircle className="w-3.5 h-3.5" />} color="green" />, active: active === "whatsapp", group: "Sistema" },
  { label: "Configurações", href: "/dashboard/settings?role=admin", icon: <NavIcon icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="slate" />, active: active === "settings", group: "Sistema" },
];

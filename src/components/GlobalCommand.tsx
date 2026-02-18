import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, Calendar, FileText, Heart, CreditCard, Upload, Users, DollarSign,
  Clock, Settings, User, LogOut, Video, BarChart3, Search,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}

const getNavItems = (role: string): NavItem[] => {
  const base: NavItem[] = [
    { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, group: "Conta" },
    { label: "Configurações", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" />, group: "Conta" },
  ];

  if (role === "patient") return [
    { label: "Início", href: "/dashboard", icon: <Home className="w-4 h-4" />, group: "Paciente" },
    { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" />, group: "Paciente" },
    { label: "Meus Agendamentos", href: "/dashboard/appointments", icon: <Clock className="w-4 h-4" />, group: "Paciente" },
    { label: "Urgência — Falar Agora", href: "/dashboard/schedule?urgency=true", icon: <Video className="w-4 h-4" />, group: "Paciente" },
    { label: "Minha Saúde", href: "/dashboard/patient/health", icon: <Heart className="w-4 h-4" />, group: "Paciente" },
    { label: "Enviar Exames", href: "/dashboard/patient/documents", icon: <Upload className="w-4 h-4" />, group: "Paciente" },
    { label: "Histórico de Pagamentos", href: "/dashboard/payment-history", icon: <CreditCard className="w-4 h-4" />, group: "Paciente" },
    ...base,
  ];

  if (role === "doctor") return [
    { label: "Início", href: "/dashboard", icon: <Home className="w-4 h-4" />, group: "Médico" },
    { label: "Agenda de Hoje", href: "/dashboard", icon: <Calendar className="w-4 h-4" />, group: "Médico" },
    { label: "Consultas", href: "/dashboard/doctor/consultations", icon: <Clock className="w-4 h-4" />, group: "Médico" },
    { label: "Sala de Espera", href: "/dashboard/doctor/waiting-room", icon: <Video className="w-4 h-4" />, group: "Médico" },
    { label: "Receitas / Prescrições", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, group: "Médico" },
    { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" />, group: "Médico" },
    { label: "Financeiro / Ganhos", href: "/dashboard/earnings", icon: <DollarSign className="w-4 h-4" />, group: "Médico" },
    { label: "Disponibilidade", href: "/dashboard/availability", icon: <Calendar className="w-4 h-4" />, group: "Médico" },
    ...base,
  ];

  if (role === "admin") return [
    { label: "Painel Admin", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, group: "Admin" },
    { label: "Usuários", href: "/dashboard/admin/users", icon: <Users className="w-4 h-4" />, group: "Admin" },
    { label: "Pacientes", href: "/dashboard/admin/patients", icon: <User className="w-4 h-4" />, group: "Admin" },
    { label: "Médicos", href: "/dashboard/admin/doctors", icon: <FileText className="w-4 h-4" />, group: "Admin" },
    { label: "Agendamentos", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" />, group: "Admin" },
    { label: "Assinaturas", href: "/dashboard/admin/subscriptions", icon: <CreditCard className="w-4 h-4" />, group: "Admin" },
    { label: "Planos", href: "/dashboard/admin/plans", icon: <DollarSign className="w-4 h-4" />, group: "Admin" },
    ...base,
  ];

  return base;
};

interface GlobalCommandProps {
  role?: string;
}

const GlobalCommand = ({ role = "patient" }: GlobalCommandProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const items = getNavItems(role);
  const groups = [...new Set(items.map(i => i.group))];

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar seção, funcionalidade..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {groups.map(group => (
          <CommandGroup key={group} heading={group}>
            {items.filter(i => i.group === group).map(item => (
              <CommandItem
                key={item.href}
                onSelect={() => handleSelect(item.href)}
                className="cursor-pointer"
              >
                <span className="mr-2 text-muted-foreground">{item.icon}</span>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Sessão">
          <CommandItem onSelect={handleSignOut} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalCommand;

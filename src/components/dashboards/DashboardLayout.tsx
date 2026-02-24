import { ReactNode, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LogOut, User, Settings, MoreHorizontal, Search, Menu, ShieldCheck, ChevronDown,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalCommand from "@/components/GlobalCommand";
import logoImg from "@/assets/logo.png";
import mascotImg from "@/assets/mascot.png";
import DashboardBreadcrumbs from "@/components/dashboards/DashboardBreadcrumbs";
import useNotificationTitle from "@/hooks/use-notification-title";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
  group?: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  nav?: NavItem[];
  role?: string;
  loading?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  patient: "Paciente",
  doctor: "Médico",
  admin: "Administrador",
  receptionist: "Recepção",
  support: "Suporte",
  clinic: "Clínica",
  partner: "Parceiro",
  affiliate: "Afiliado",
  ai: "Assistente IA",
};

const ROLE_COLORS: Record<string, string> = {
  patient: "bg-primary/15 text-primary border-primary/20",
  doctor: "bg-secondary/15 text-secondary border-secondary/20",
  admin: "bg-destructive/15 text-destructive border-destructive/20",
  receptionist: "bg-warning/15 text-warning border-warning/20",
  support: "bg-warning/15 text-warning border-warning/20",
  clinic: "bg-primary/15 text-primary border-primary/20",
  partner: "bg-success/15 text-success border-success/20",
  affiliate: "bg-muted text-muted-foreground border-border",
  ai: "bg-primary/15 text-primary border-primary/20",
};

const ROLE_ICON: Record<string, string> = {
  patient: "👤",
  doctor: "🩺",
  admin: "⚙️",
  receptionist: "🏥",
  support: "🎧",
  clinic: "🏢",
  partner: "🤝",
  affiliate: "📣",
  ai: "🤖",
};

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

const DashboardLayout = ({ children, title, nav, role = "patient" }: DashboardLayoutProps) => {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  useNotificationTitle();

  const isAdmin = roles.includes("admin");
  const forceRole = searchParams.get("role");
  const isAdminViewingOtherPanel = isAdmin && forceRole && forceRole !== "admin";

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "Usuário";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Group nav items
  const navGroups = useMemo(() => {
    if (!nav) return [];
    const groups: { label: string; items: NavItem[] }[] = [];
    let currentGroup: { label: string; items: NavItem[] } = { label: "", items: [] };
    nav.forEach(item => {
      if (item.group && item.group !== currentGroup.label) {
        if (currentGroup.items.length > 0) groups.push(currentGroup);
        currentGroup = { label: item.group, items: [item] };
      } else {
        currentGroup.items.push(item);
      }
    });
    if (currentGroup.items.length > 0) groups.push(currentGroup);
    return groups;
  }, [nav]);

  const bottomNav = nav?.slice(0, 4) ?? [];
  const moreNav = nav && nav.length > 4 ? nav.slice(4) : [];

  /* ── Nav item renderer — clean flat style ── */
  const NavItemRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
        item.active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <span className={`shrink-0 transition-colors duration-200 ${
        item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      }`}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground leading-none min-w-[18px] text-center">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {item.active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/30 shrink-0">
        <img src={logoImg} alt="AloClinica" className="w-9 h-9 object-contain" loading="lazy" />
        <span className="font-bold text-base text-foreground tracking-tight">AloClínica</span>
      </div>

      {/* Role badge with icon */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${ROLE_COLORS[role] ?? ROLE_COLORS.patient}`}>
          <span>{ROLE_ICON[role] ?? "👤"}</span>
          {ROLE_LABELS[role] ?? title}
        </div>
      </div>

      {/* Admin back button */}
      {isAdminViewingOtherPanel && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={() => { navigate("/dashboard"); onItemClick?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors border border-destructive/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Voltar ao Painel Admin
          </button>
        </div>
      )}

      {/* Nav items with optional group labels */}
      {nav && nav.length > 0 && (
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 pt-4 pb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemRow key={item.href} item={item} onClick={onItemClick} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      )}

      {/* Bottom user card */}
      <div className="p-3 border-t border-border/30 mt-auto shrink-0">
        <button
          onClick={() => { navigate("/dashboard/profile"); onItemClick?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/30 group-hover:ring-primary/20 transition-all">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{fullName}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{ROLE_LABELS[role] ?? title}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0 ring-2 ring-background" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ══ Header ══ */}
      <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-card/95 backdrop-blur-xl flex items-center px-4 gap-3 shadow-sm safe-area-pt">

        {/* Mobile hamburger */}
        {nav && nav.length > 0 && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0">
                <Menu className="w-4.5 h-4.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] flex flex-col border-border/40">
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 md:hidden">
          <img src={logoImg} alt="AloClinica" className="w-7 h-7 object-contain" loading="lazy" />
        </Link>
        <Link to="/" className="hidden md:flex items-center gap-2 shrink-0">
          <span className="font-bold text-foreground text-sm tracking-tight">AloClínica</span>
        </Link>

        {/* ⌘K search bar */}
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex flex-1 max-w-sm items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 text-xs text-muted-foreground transition-all duration-200 group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors shrink-0" />
          <span className="flex-1 text-left hidden sm:block">Buscar...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-card border border-border/50 rounded px-1.5 py-0.5 leading-none">⌘K</kbd>
        </button>

        <div className="flex-1" />

        {/* Admin quick-return */}
        {isAdminViewingOtherPanel && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-success/30 bg-success/10 text-success text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Online
          </div>

          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 rounded-xl hover:bg-muted/50 transition-all">
                <Avatar className="h-7 w-7">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-xs font-medium text-foreground max-w-[100px] truncate">
                  {profile?.first_name ?? "Usuário"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-lg p-1.5">
              <DropdownMenuLabel className="pb-1.5">
                <p className="text-sm font-semibold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground font-normal">{ROLE_LABELS[role] ?? title}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-lg gap-2 cursor-pointer text-sm">
                <User className="h-4 w-4 text-muted-foreground" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-lg gap-2 cursor-pointer text-sm">
                <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="rounded-lg gap-2 cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ══ Body ══ */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar desktop ── */}
        {nav && nav.length > 0 && (
          <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/30 bg-card/50 sticky top-14 h-[calc(100vh-3.5rem)]">
            <SidebarContent />
          </aside>
        )}

        {/* ── Main content with page transition ── */}
        <main className="flex-1 min-w-0 overflow-auto pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              {...pageTransition}
              className="px-3 py-3 sm:p-6"
            >
              <DashboardBreadcrumbs />
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ══ Global Command ══ */}
      <GlobalCommand role={role} />

      {/* ══ Mobile bottom nav ══ */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur-xl border-t border-border/40"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
        >
          <div className="flex items-stretch h-[60px]">
            {bottomNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium transition-all duration-200 ${
                  item.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.active && (
                  <motion.span
                    layoutId="mobile-active-top"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-b-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  item.active ? "bg-primary/10" : ""
                }`}>
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full bg-destructive text-destructive-foreground leading-none min-w-[14px] text-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-[52px] leading-tight text-center">{item.label}</span>
              </Link>
            ))}

            {/* Pingo button */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-pingo-chat"))}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium text-muted-foreground"
            >
              <span className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={mascotImg} alt="Pingo" className="w-7 h-7 object-cover rounded-full" />
              </span>
              <span className="truncate max-w-[52px] leading-tight text-center">Pingo</span>
            </button>

            {moreNav.length > 0 && (
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button className={`flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium transition-colors ${moreNav.some(i => i.active) ? "text-primary" : "text-muted-foreground"}`}>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${moreNav.some(i => i.active) ? "bg-primary/10" : ""}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </span>
                    <span>Mais</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl border-border/40">
                  <div className="pt-1 pb-6">
                    <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-2">{title}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {moreNav.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-[11px] font-medium transition-all ${
                            item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.active ? "bg-primary/15 text-primary" : "bg-muted/60"}`}>
                            {item.icon}
                          </span>
                          <span className="text-center leading-tight line-clamp-1">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  LogOut, User, Settings, MoreHorizontal, Search, ChevronRight, Menu, ShieldCheck,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalCommand from "@/components/GlobalCommand";
import logoImg from "@/assets/logo.png";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  nav?: NavItem[];
  role?: string;
  loading?: boolean;
}

const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  patient:      { bg: "bg-primary/10",     text: "text-primary",          dot: "bg-primary" },
  doctor:       { bg: "bg-secondary/10",   text: "text-secondary",        dot: "bg-secondary" },
  admin:        { bg: "bg-destructive/10", text: "text-destructive",      dot: "bg-destructive" },
  receptionist: { bg: "bg-warning/10",     text: "text-warning",          dot: "bg-warning" },
  support:      { bg: "bg-warning/10",     text: "text-warning",          dot: "bg-warning" },
  clinic:       { bg: "bg-primary/10",     text: "text-primary",          dot: "bg-primary" },
  partner:      { bg: "bg-success/10",     text: "text-success",          dot: "bg-success" },
  affiliate:    { bg: "bg-muted",          text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const DashboardLayout = ({ children, title, nav, role = "patient", loading: externalLoading }: DashboardLayoutProps) => {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();

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

  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.patient;

  const bottomNav = nav?.slice(0, 4) ?? [];
  const moreNav = nav && nav.length > 4 ? nav.slice(4) : [];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/40 shrink-0">
        <img src={logoImg} alt="AloClinica" className="w-8 h-8 object-contain" loading="lazy" />
        <span className="font-bold text-sm text-foreground hidden sm:block md:block">AloClínica</span>
      </div>

      {/* Role badge */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`} />
          {title}
        </div>
      </div>

      {/* Admin back button when viewing other panel */}
      {isAdminViewingOtherPanel && (
        <div className="px-3 pb-1 shrink-0">
          <button
            onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Voltar ao Painel Admin
          </button>
        </div>
      )}

      {/* Nav items */}
      {nav && nav.length > 0 && (
        <nav className="flex flex-col gap-0.5 px-3 flex-1 py-2 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                item.active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item.active && (
                <motion.span
                  layoutId="sidebar-active-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`shrink-0 transition-all duration-150 ${item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.active && <ChevronRight className="w-3 h-3 text-primary/40 shrink-0" />}
            </Link>
          ))}
        </nav>
      )}

      {/* Bottom user card */}
      <div className="p-3 border-t border-border/40 mt-auto shrink-0">
        <button
          onClick={() => { navigate("/dashboard/profile"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/60 transition-colors text-left"
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{fullName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{title}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-success shrink-0 animate-pulse" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ══ Header ══ */}
      <header className="sticky top-0 z-50 h-14 border-b border-border/50 bg-card/95 backdrop-blur-xl flex items-center px-3 gap-2 shadow-sm">

        {/* Mobile hamburger */}
        {nav && nav.length > 0 && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col border-border/50">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 md:hidden">
          <img src={logoImg} alt="AloClinica" className="w-7 h-7 object-contain" loading="lazy" />
        </Link>
        <Link to="/" className="hidden md:flex items-center gap-2 shrink-0">
          <span className="font-bold text-foreground text-sm">AloClínica</span>
        </Link>

        {/* ⌘K search bar */}
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex flex-1 max-w-xs items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 text-xs text-muted-foreground transition-all duration-200 group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors shrink-0" />
          <span className="flex-1 text-left hidden sm:block">Buscar...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-card border border-border/60 rounded px-1.5 py-0.5 leading-none">⌘K</kbd>
        </button>

        <div className="flex-1" />

        {/* Admin quick-return button in header */}
        {isAdminViewingOtherPanel && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => navigate("/dashboard")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full border border-success/25 bg-success/8 text-success text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Online
          </div>

          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 rounded-xl hover:bg-muted/60 transition-all">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-xs font-medium text-foreground max-w-[80px] truncate">
                  {profile?.first_name ?? "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/60 shadow-lg p-1.5">
              <DropdownMenuLabel className="pb-1.5">
                <p className="text-sm font-semibold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground font-normal">{title}</p>
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
          <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/40 bg-card sticky top-14 h-[calc(100vh-3.5rem)]">
            <SidebarContent />
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-auto pb-24 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 sm:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ══ Global Command ══ */}
      <GlobalCommand role={role} />

      {/* ══ Mobile bottom nav ══ */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur-xl border-t border-border/50"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
        >
          <div className="flex items-stretch h-14">
            {bottomNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium transition-all duration-200 ${
                  item.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.active && (
                  <motion.span
                    layoutId="mobile-active-top"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-b-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`transition-transform duration-200 ${item.active ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                <span className="truncate max-w-[52px] leading-tight text-center">{item.label}</span>
              </Link>
            ))}

            {moreNav.length > 0 && (
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium transition-colors ${moreNav.some(i => i.active) ? "text-primary" : "text-muted-foreground"}`}>
                    <MoreHorizontal className="w-4 h-4" />
                    <span>Mais</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl border-border/50">
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
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.active ? "bg-primary/20 text-primary" : "bg-muted/80"}`}>
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

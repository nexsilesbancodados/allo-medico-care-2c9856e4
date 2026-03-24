import { ReactNode, useState, useMemo, useEffect, useRef, isValidElement, cloneElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, User, Settings, MoreHorizontal, Search, Menu, ShieldCheck, ChevronDown, Download, X, Smartphone, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalCommand from "@/components/GlobalCommand";
import logoImg from "@/assets/logo.png";
import mascotImg from "@/assets/mascot.png";
import DashboardBreadcrumbs from "@/components/dashboards/DashboardBreadcrumbs";
import useNotificationTitle from "@/hooks/use-notification-title";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface NavItem {
  label: string; href: string; icon: ReactNode;
  active?: boolean; group?: string; badge?: number;
}
interface DashboardLayoutProps {
  children: ReactNode; title: string;
  nav?: NavItem[]; role?: string; loading?: boolean;
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const ROLE_LABELS: Record<string, string> = {
  patient:"Paciente", doctor:"Médico", admin:"Administrador",
  receptionist:"Recepção", support:"Suporte", clinic:"Clínica",
  partner:"Parceiro", ai:"Assistente IA",
};
const ROLE_COLORS: Record<string, string> = {
  patient:"bg-primary/10 text-primary border-primary/20",
  doctor:"bg-secondary/10 text-secondary border-secondary/20",
  admin:"bg-destructive/10 text-destructive border-destructive/20",
  receptionist:"bg-warning/10 text-warning border-warning/20",
  support:"bg-warning/10 text-warning border-warning/20",
  clinic:"bg-primary/10 text-primary border-primary/20",
  partner:"bg-success/10 text-success border-success/20",
  ai:"bg-primary/10 text-primary border-primary/20",
};
const ROLE_ICON: Record<string, string> = {
  patient:"👤", doctor:"🩺", admin:"⚙️", receptionist:"🏥",
  support:"🎧", clinic:"🏢", partner:"🤝", ai:"🤖",
};
const ROLE_GRADIENT: Record<string, string> = {
  patient:"from-[hsl(210,90%,45%)] to-[hsl(195,85%,50%)]",
  doctor:"from-[hsl(160,55%,45%)] to-[hsl(175,60%,45%)]",
  admin:"from-[hsl(0,84%,60%)] to-[hsl(350,80%,55%)]",
  receptionist:"from-[hsl(38,92%,50%)] to-[hsl(25,90%,52%)]",
  support:"from-[hsl(45,90%,50%)] to-[hsl(38,92%,50%)]",
  clinic:"from-[hsl(210,90%,45%)] to-[hsl(230,70%,55%)]",
  partner:"from-[hsl(142,71%,45%)] to-[hsl(160,55%,45%)]",
  ai:"from-[hsl(200,80%,50%)] to-[hsl(210,90%,45%)]",
};
// Mobile header gradient per role — each role gets a unique color identity
const ROLE_HEADER_GRADIENT: Record<string, string> = {
  patient:"bg-gradient-to-r from-[hsl(210,90%,45%)] via-[hsl(200,88%,48%)] to-[hsl(195,85%,50%)]",
  doctor:"bg-gradient-to-r from-[hsl(155,60%,38%)] via-[hsl(160,55%,42%)] to-[hsl(170,50%,45%)]",
  admin:"bg-gradient-to-r from-[hsl(260,65%,50%)] via-[hsl(270,60%,48%)] to-[hsl(280,55%,52%)]",
  receptionist:"bg-gradient-to-r from-[hsl(25,85%,48%)] via-[hsl(30,88%,50%)] to-[hsl(38,92%,52%)]",
  support:"bg-gradient-to-r from-[hsl(38,85%,45%)] via-[hsl(42,90%,48%)] to-[hsl(48,85%,52%)]",
  clinic:"bg-gradient-to-r from-[hsl(215,75%,42%)] via-[hsl(225,70%,48%)] to-[hsl(235,65%,52%)]",
  partner:"bg-gradient-to-r from-[hsl(142,65%,38%)] via-[hsl(150,60%,42%)] to-[hsl(160,55%,45%)]",
  ai:"bg-gradient-to-r from-[hsl(200,80%,45%)] via-[hsl(210,85%,48%)] to-[hsl(220,80%,52%)]",
};
// Bottom nav active color per role
const ROLE_ACTIVE_COLOR: Record<string, string> = {
  patient:"text-[hsl(210,90%,45%)]",
  doctor:"text-[hsl(160,55%,42%)]",
  admin:"text-[hsl(265,60%,52%)]",
  receptionist:"text-[hsl(30,88%,48%)]",
  support:"text-[hsl(42,90%,48%)]",
  clinic:"text-[hsl(225,70%,48%)]",
  partner:"text-[hsl(148,60%,40%)]",
  ai:"text-[hsl(210,85%,48%)]",
};
const ROLE_ACTIVE_BG: Record<string, string> = {
  patient:"bg-[hsl(210,90%,45%,0.12)]",
  doctor:"bg-[hsl(160,55%,42%,0.12)]",
  admin:"bg-[hsl(265,60%,52%,0.12)]",
  receptionist:"bg-[hsl(30,88%,48%,0.12)]",
  support:"bg-[hsl(42,90%,48%,0.12)]",
  clinic:"bg-[hsl(225,70%,48%,0.12)]",
  partner:"bg-[hsl(148,60%,40%,0.12)]",
  ai:"bg-[hsl(210,85%,48%,0.12)]",
};


// ── PWA Banner ────────────────────────────────────────────────────────────────
const PWABanner = ({ role }: { role: string }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage<boolean>("pwa-dismissed", false);
  const [dismissedUntil, setDismissedUntil] = useLocalStorage<number>("pwa-dismissed-until", 0);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (dismissed && Date.now() < dismissedUntil) return;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(ios);
    if (ios) { const t = setTimeout(() => setShow(true), 4000); return () => clearTimeout(t); }
    const h = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); setTimeout(() => setShow(true), 3000); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, [dismissed, dismissedUntil]);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setDismissed(true); setDismissedUntil(Date.now() + 365 * 86400000); }
    setShow(false); setDeferredPrompt(null);
  };
  const dismiss = () => { setShow(false); setDismissed(true); setDismissedUntil(Date.now() + 7 * 86400000); };
  const grad = ROLE_GRADIENT[role] ?? "from-blue-500 to-cyan-500";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 26 }}
          className="fixed z-[60] bottom-[80px] left-3 right-3 md:hidden"
          role="dialog" aria-label="Instalar AloClínica"
        >
          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 48px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-secondary/15 pointer-events-none" />
            <div className="relative bg-card/96 backdrop-blur-2xl m-[1px] rounded-[15px] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Smartphone className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Instalar AloClínica</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isIOS ? "Toque ⎙ → Adicionar à Tela Inicial" : "App nativo · Offline · Notificações"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isIOS && (
                    <Button size="sm" onClick={install}
                      className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-md">
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Instalar
                    </Button>
                  )}
                  <button onClick={dismiss}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
                    aria-label="Dispensar">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const DashboardLayout = ({ children, title, nav, role = "patient" }: DashboardLayoutProps) => {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const { signOut } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useNotificationTitle();

  const isAdmin = roles.includes("admin");
  const forceRole = searchParams.get("role");
  const isAdminViewingOtherPanel = isAdmin && forceRole && forceRole !== "admin";
  const grad = ROLE_GRADIENT[role] ?? ROLE_GRADIENT.patient;

  const initials = profile ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() : "?";
  const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "Usuário";
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const navGroups = useMemo(() => {
    if (!nav) return [];
    const groups: { label: string; items: NavItem[] }[] = [];
    let cur: { label: string; items: NavItem[] } = { label: "", items: [] };
    nav.forEach(item => {
      if (item.group && item.group !== cur.label) {
        if (cur.items.length) groups.push(cur);
        cur = { label: item.group, items: [item] };
      } else { cur.items.push(item); }
    });
    if (cur.items.length) groups.push(cur);
    return groups;
  }, [nav]);

  // Bottom nav: first 5 items + Pingo + More
  const BOTTOM_COUNT = 5;
  const bottomNav = nav?.slice(0, BOTTOM_COUNT) ?? [];
  const moreNav  = nav && nav.length > BOTTOM_COUNT ? nav.slice(BOTTOM_COUNT) : [];

  // GSAP sidebar entrance — only on first mount (no dep on nav to avoid flicker)
  const sidebarAnimated = useRef(false);
  useEffect(() => {
    if (sidebarAnimated.current || !sidebarRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sidebarAnimated.current = true;
    const items = sidebarRef.current.querySelectorAll(".nav-item");
    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(items, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.035, ease: "power2.out", clearProps: "transform,opacity" });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GSAP header entrance
  useEffect(() => {
    if (!headerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = headerRef.current;
    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(el, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", clearProps: "transform,opacity" });
    }).catch(() => {});
  }, []);

  const NavItemRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    // Clone NavIcon to inject active state
    const icon = isValidElement(item.icon) && (item.icon.props as any)?.color
      ? cloneElement(item.icon as React.ReactElement<any>, { active: item.active })
      : item.icon;

    return (
      <Link to={item.href} onClick={onClick}
        className={`nav-item group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 relative ${
          item.active
            ? "bg-primary text-primary-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,.15)]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <span className={`shrink-0 transition-transform duration-200 ${item.active ? "" : "group-hover:scale-110"}`}>{icon}</span>
        <span className="flex-1 truncate">{item.label}</span>
        {(item.badge ?? 0) > 0 && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center tabular-nums ${
            item.active ? "bg-white/25 text-white" : "bg-destructive text-white"
          }`}>
            {(item.badge ?? 0) > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ onItemClick, collapsed = false }: { onItemClick?: () => void; collapsed?: boolean }) => (
    <div ref={sidebarRef} className="flex flex-col h-full">
      {/* Spacer top */}
      <div className="h-3 shrink-0" />

      {/* Role badge */}
      {!collapsed && (
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${ROLE_COLORS[role] ?? ROLE_COLORS.patient}`}>
            <span className="text-xs">{ROLE_ICON[role] ?? "👤"}</span>
            {ROLE_LABELS[role] ?? title}
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <span className="text-base">{ROLE_ICON[role] ?? "👤"}</span>
        </div>
      )}

      {isAdminViewingOtherPanel && !collapsed && (
        <div className="px-3 pb-1 shrink-0">
          <button onClick={() => { navigate("/dashboard"); onItemClick?.(); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-destructive bg-destructive/8 hover:bg-destructive/15 transition-all duration-200">
            <ShieldCheck className="w-3 h-3" /> Voltar ao Admin
          </button>
        </div>
      )}

      {nav && nav.length > 0 && (
        <nav className={`flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-border/50 ${collapsed ? "px-1.5" : "px-2.5"}`}>
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em] px-2.5 pt-4 pb-1.5">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && gi > 0 && (
                <div className="mx-2 my-2 border-t border-border/10" />
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  collapsed ? (
                    <Link key={item.href} to={item.href} onClick={onItemClick}
                      title={item.label}
                      className={`nav-item group flex items-center justify-center p-2 rounded-xl transition-all duration-200 relative ${
                        item.active
                          ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,.15)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}>
                      <span className="shrink-0">{
                        isValidElement(item.icon) && (item.icon.props as any)?.color
                          ? cloneElement(item.icon as React.ReactElement<any>, { active: item.active })
                          : item.icon
                      }</span>
                      {(item.badge ?? 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-white flex items-center justify-center">
                          {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <NavItemRow key={item.href} item={item} onClick={onItemClick} />
                  )
                ))}
              </div>
            </div>
          ))}
        </nav>
      )}

      {/* User area */}
      <div className={`mt-auto shrink-0 border-t border-border/10 ${collapsed ? "p-1.5" : "p-2.5"}`}>
        {collapsed ? (
          <button onClick={() => { navigate("/dashboard/profile"); onItemClick?.(); }}
            title="Meu Perfil"
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-muted/50 transition-all duration-200">
            <Avatar className="h-7 w-7 ring-2 ring-border/15">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-[9px] font-bold`}>{initials}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button onClick={() => { navigate("/dashboard/profile"); onItemClick?.(); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/50 transition-all duration-200 text-left group">
            <Avatar className="h-8 w-8 ring-2 ring-border/15 group-hover:ring-primary/25 transition-all">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-[10px] font-bold`}>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{fullName}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{ROLE_LABELS[role] ?? title}</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">

      {/* ═══ Mobile Header — app-like blue gradient ═══ */}
      <header ref={headerRef}
        className="sticky top-0 z-50 md:h-14 md:bg-background/95 md:backdrop-blur-xl md:border-b md:border-border/15 flex items-center gap-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Mobile: gradient header */}
        <div className={`md:hidden w-full ${ROLE_HEADER_GRADIENT[role] ?? ROLE_HEADER_GRADIENT.patient} px-4 py-3 flex items-center gap-3`}>
          {nav && nav.length > 0 && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/90 hover:bg-white/15" aria-label="Abrir menu">
                  <Menu className="w-5 h-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] border-border/20 bg-background">
                <SidebarContent onItemClick={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Home">
            <img src={mascotImg} alt="AloClínica" className="w-8 h-8 object-contain select-none" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.2))" }} />
            <span className="font-black text-white text-[15px] tracking-tight">AloClínica</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative focus-visible:outline-none" aria-label="Menu do usuário">
                  <Avatar className="h-8 w-8 ring-2 ring-white/30">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-white/20 text-white text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] border-2 border-[hsl(var(--primary))]" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl border-border/30 shadow-xl p-1.5">
                <div className="flex items-center gap-2.5 p-2.5 mb-1">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-xs font-bold`}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                    <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role] ?? title}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border/15" />
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/15" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2 text-destructive focus:text-destructive focus:bg-destructive/8">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop: standard header */}
        <div className="hidden md:flex w-full items-center px-4 h-14 gap-3">
          {nav && nav.length > 0 && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl" aria-label="Abrir menu">
                  <Menu className="w-4.5 h-4.5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px] border-border/20 bg-background">
                <SidebarContent onItemClick={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={mascotImg} alt="AloClínica" className="w-8 h-8 object-contain select-none shrink-0"
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.15))" }} />
            <span className="font-bold text-foreground text-sm tracking-tight">AloClínica</span>
          </Link>

          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
            className="flex flex-1 max-w-xs items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted/80 text-xs text-muted-foreground transition-all group"
            aria-label="Buscar">
            <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="font-mono text-[10px] bg-background border border-border/40 rounded px-1.5 py-0.5 leading-none">⌘K</kbd>
          </button>

          <div className="flex-1" />

          {isAdminViewingOtherPanel && (
            <Button variant="outline" size="sm"
              className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/8 rounded-xl"
              onClick={() => navigate("/dashboard")}>
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Admin
            </Button>
          )}

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 h-9 pl-0.5 pr-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-[10px] font-bold`}>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--success))] border-[1.5px] border-background" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-foreground max-w-[90px] truncate">{profile?.first_name ?? "Usuário"}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl border-border/30 shadow-xl p-1.5">
                <div className="flex items-center gap-2.5 p-2.5 mb-1">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-xs font-bold`}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                    <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role] ?? title}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border/15" />
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/15" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg gap-2 cursor-pointer text-[13px] py-2 text-destructive focus:text-destructive focus:bg-destructive/8">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {nav && nav.length > 0 && (
          <aside className={`hidden md:flex shrink-0 flex-col bg-background border-r border-border/15 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto transition-all duration-200 ${
            sidebarCollapsed ? "w-[52px]" : "w-52 lg:w-60 xl:w-64"
          }`}>
            <SidebarContent collapsed={sidebarCollapsed} />
            {/* Collapse toggle */}
            <div className={`shrink-0 border-t border-border/10 ${sidebarCollapsed ? "p-1.5" : "px-2.5 py-1.5"}`}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expandir menu" : "Encolher menu"}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 text-[11px]"
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
                  : <><PanelLeftClose className="w-4 h-4 shrink-0" /><span>Encolher</span></>
                }
              </button>
            </div>
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-24 md:pb-10 scroll-smooth">
          <div className="px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 min-h-0 max-w-[1400px] mx-auto">
            <div className="hidden md:block"><DashboardBreadcrumbs /></div>
            {children}
          </div>
        </main>
      </div>

      <GlobalCommand role={role} />
      <PWABanner role={role} />

      {/* ═══ Mobile bottom nav — app-like with pill active state ═══ */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-2xl border-t border-border/10 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
          aria-label="Navegação principal"
        >
          <div className="flex items-stretch h-[64px]">
            {bottomNav.map(item => (
              <Link key={item.href} to={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-200 select-none active:scale-90 ${
                  item.active ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                <span className={`relative flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-200 ${
                  item.active ? "bg-primary/12 scale-105" : ""
                }`}>
                  {item.icon}
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-0.5 text-[8px] font-bold min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white flex items-center justify-center tabular-nums">
                      {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] truncate max-w-[52px] leading-none ${
                  item.active ? "font-bold text-primary" : "font-medium"
                }`}>{item.label}</span>
              </Link>
            ))}

            {moreNav.length > 0 && (
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium select-none active:scale-90 transition-all duration-200 ${
                      moreNav.some(i => i.active) ? "text-primary" : "text-muted-foreground/60"
                    }`}
                    aria-label="Mais opções">
                    <span className={`w-10 h-7 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      moreNav.some(i => i.active) ? "bg-primary/12" : ""
                    }`}>
                      <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className={moreNav.some(i => i.active) ? "font-bold" : ""}>Mais</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl border-border/20 bg-background max-h-[70vh]"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
                  <div className="pt-2 overflow-y-auto">
                    <div className="w-10 h-1 bg-muted-foreground/15 rounded-full mx-auto mb-4" aria-hidden="true" />

                    {(() => {
                      const groups: { label: string; items: NavItem[] }[] = [];
                      let cur: { label: string; items: NavItem[] } = { label: "", items: [] };
                      moreNav.forEach(item => {
                        if (item.group && item.group !== cur.label) {
                          if (cur.items.length) groups.push(cur);
                          cur = { label: item.group, items: [item] };
                        } else { cur.items.push(item); }
                      });
                      if (cur.items.length) groups.push(cur);

                      return groups.map((group, gi) => (
                        <div key={gi} className="mb-4">
                          {group.label && (
                            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-4">{group.label}</p>
                          )}
                          <div className="grid grid-cols-4 gap-2 px-2">
                            {group.items.map(item => (
                              <Link key={item.href} to={item.href} onClick={() => setMoreOpen(false)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-[11px] font-medium transition-all ${item.active ? "bg-foreground/8 text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.active ? "bg-foreground text-background" : "bg-muted/60"}`}>
                                  {item.icon}
                                </span>
                                <span className="text-center leading-tight line-clamp-1">{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Pingo assistant in More sheet */}
                    <div className="px-2 mt-2 mb-2">
                      <button
                        onClick={() => { setMoreOpen(false); window.dispatchEvent(new Event("open-pingo-chat")); }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <img src={mascotImg} alt="" className="w-7 h-7 object-cover rounded-full" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground">Pingo IA</p>
                          <p className="text-[11px] text-muted-foreground">Assistente virtual</p>
                        </div>
                        <span className="ml-auto w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                      </button>
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

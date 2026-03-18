import { ReactNode, useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, User, Settings, MoreHorizontal, Search, Menu, ShieldCheck, ChevronDown, Download, X, Smartphone } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalCommand from "@/components/GlobalCommand";
import logoImg from "@/assets/logo.png";
import mascotImg from "@/assets/mascot.png";
import DashboardBreadcrumbs from "@/components/dashboards/DashboardBreadcrumbs";
import useNotificationTitle from "@/hooks/use-notification-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
// gsap loaded dynamically for entrance animations

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
  patient:"from-blue-500 to-cyan-500",
  doctor:"from-emerald-500 to-teal-500",
  admin:"from-red-500 to-rose-500",
  receptionist:"from-amber-500 to-orange-500",
  support:"from-yellow-500 to-amber-500",
  clinic:"from-blue-500 to-indigo-500",
  partner:"from-green-500 to-emerald-500",
  ai:"from-sky-500 to-blue-500",
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

  // GSAP sidebar entrance — only on first mount
  const sidebarAnimated = useRef(false);
  useEffect(() => {
    if (sidebarAnimated.current || !sidebarRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sidebarAnimated.current = true;
    const items = sidebarRef.current.querySelectorAll(".nav-item");
    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(items, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.035, ease: "power2.out", clearProps: "transform,opacity" });
    }).catch(() => {});
  }, [nav]);

  // GSAP header entrance
  useEffect(() => {
    if (!headerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(headerRef.current, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", clearProps: "transform,opacity" });
  }, []);

  const NavItemRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
    <Link to={item.href} onClick={onClick}
      className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 relative ${
        item.active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {item.active && (
        <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full bg-primary" />
      )}
      <span className={`shrink-0 transition-colors ${item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {(item.badge ?? 0) > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-white leading-none min-w-[18px] text-center tabular-nums">
          {(item.badge ?? 0) > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div ref={sidebarRef} className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/30 shrink-0">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md`}>
          <img src={logoImg} alt="AloClínica" className="w-4.5 h-4.5 object-contain brightness-0 invert" loading="lazy" />
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">AloClínica</span>
      </div>

      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[role] ?? ROLE_COLORS.patient}`}>
          <span>{ROLE_ICON[role] ?? "👤"}</span>
          {ROLE_LABELS[role] ?? title}
        </div>
      </div>

      {isAdminViewingOtherPanel && (
        <div className="px-4 pb-2 shrink-0">
          <button onClick={() => { navigate("/dashboard"); onItemClick?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive bg-destructive/8 hover:bg-destructive/15 transition-colors border border-destructive/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Voltar ao Painel Admin
          </button>
        </div>
      )}

      {nav && nav.length > 0 && (
        <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-border/50">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 pt-4 pb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => <NavItemRow key={item.href} item={item} onClick={onItemClick} />)}
              </div>
            </div>
          ))}
        </nav>
      )}

      <div className="p-3 border-t border-border/30 mt-auto shrink-0">
        <button onClick={() => { navigate("/dashboard/profile"); onItemClick?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group">
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 ring-2 ring-border/30 group-hover:ring-primary/20 transition-all">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-xs font-bold`}>{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{fullName}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{ROLE_LABELS[role] ?? title}</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header ref={headerRef}
        className="sticky top-0 z-50 h-14 border-b border-border/25 bg-background/80 backdrop-blur-2xl flex items-center px-4 gap-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {nav && nav.length > 0 && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl hover:bg-muted/60" aria-label="Abrir menu">
                <Menu className="w-4.5 h-4.5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-border/30 bg-card">
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        <Link to="/" className="flex items-center gap-2 shrink-0 md:hidden" aria-label="Home">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <img src={logoImg} alt="" className="w-4 h-4 object-contain brightness-0 invert" />
          </div>
        </Link>
        <Link to="/" className="hidden md:flex items-center gap-2 shrink-0">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <img src={logoImg} alt="" className="w-4 h-4 object-contain brightness-0 invert" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight">AloClínica</span>
        </Link>

        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="flex flex-1 max-w-sm items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 text-xs text-muted-foreground transition-all group"
          aria-label="Buscar">
          <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left hidden sm:block">Buscar...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-background border border-border/50 rounded px-1.5 py-0.5 leading-none">⌘K</kbd>
        </button>

        <div className="flex-1" />

        {isAdminViewingOtherPanel && (
          <Button variant="outline" size="sm"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/8 rounded-xl hidden sm:flex"
            onClick={() => navigate("/dashboard")}>
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Admin
          </Button>
        )}

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-success/25 bg-success/8 text-success text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            Online
          </div>
          <ThemeToggle />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 rounded-xl hover:bg-muted/50">
                <Avatar className="h-7 w-7">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-[10px] font-bold`}>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-xs font-medium text-foreground max-w-[100px] truncate">{profile?.first_name ?? "Usuário"}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/40 shadow-2xl p-1.5">
              <DropdownMenuLabel className="pb-1.5">
                <p className="text-sm font-semibold">{fullName}</p>
                <p className="text-xs text-muted-foreground font-normal">{ROLE_LABELS[role] ?? title}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-xl gap-2 cursor-pointer text-sm">
                <User className="h-4 w-4 text-muted-foreground" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-xl gap-2 cursor-pointer text-sm">
                <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="rounded-xl gap-2 cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/8">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {nav && nav.length > 0 && (
          <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col border-r border-border/25 bg-card/40 sticky top-14 h-[calc(100vh-3.5rem)]">
            <SidebarContent />
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-auto pb-24 md:pb-8">
          <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
            <DashboardBreadcrumbs />
            {children}
          </div>
        </main>
      </div>

      <GlobalCommand role={role} />
      <PWABanner role={role} />

      {/* ═══ Mobile bottom nav — redesigned ═══ */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-border/20"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
          aria-label="Navegação principal"
        >
          <div className="flex items-stretch h-[64px]">
            {bottomNav.map(item => (
              <Link key={item.href} to={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-150 select-none ${item.active ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary" />
                )}
                <span className={`relative flex items-center justify-center w-9 h-7 rounded-xl transition-colors duration-150 ${item.active ? "bg-primary/12 scale-110" : ""}`}>
                  {item.icon}
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center tabular-nums">
                      {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-medium truncate max-w-[48px] leading-none ${item.active ? "font-semibold" : ""}`}>{item.label}</span>
              </Link>
            ))}

            {moreNav.length > 0 && (
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium select-none active:scale-95 transition-transform ${moreNav.some(i => i.active) ? "text-primary" : "text-muted-foreground"}`}
                    aria-label="Mais opções">
                    <span className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors duration-150 ${moreNav.some(i => i.active) ? "bg-primary/12" : ""}`}>
                      <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span>Mais</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl border-border/25 bg-card/98 backdrop-blur-2xl max-h-[70vh]"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
                  <div className="pt-2 overflow-y-auto">
                    <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" aria-hidden="true" />

                    {/* Group items by group label */}
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
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 px-4">{group.label}</p>
                          )}
                          <div className="grid grid-cols-4 gap-2 px-2">
                            {group.items.map(item => (
                              <Link key={item.href} to={item.href} onClick={() => setMoreOpen(false)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl text-[11px] font-medium transition-all ${item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.active ? "bg-primary/15 text-primary" : "bg-muted/80"}`}>
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
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <img src={mascotImg} alt="" className="w-7 h-7 object-cover rounded-full" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground">Pingo IA</p>
                          <p className="text-[11px] text-muted-foreground">Assistente virtual</p>
                        </div>
                        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-success" aria-hidden="true" />
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

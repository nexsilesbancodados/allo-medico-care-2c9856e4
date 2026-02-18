import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, User, Settings, Phone, MoreHorizontal, Search, ChevronRight } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalCommand from "@/components/GlobalCommand";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  nav?: { label: string; href: string; icon: ReactNode; active?: boolean }[];
  role?: string;
}

const DashboardLayout = ({ children, title, nav, role = "patient" }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

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

  // Split nav: first 4 for bottom bar, rest in "More" sheet
  const bottomNav = nav?.slice(0, 4) ?? [];
  const moreNav = nav && nav.length > 4 ? nav.slice(4) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* ──── Top header ──── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-hero flex items-center justify-center shadow-sm">
              <Phone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-sm hidden sm:block">AloClinica</span>
          </Link>

          {/* Search hint — desktop */}
          <button
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
              window.dispatchEvent(e);
            }}
            className="hidden sm:flex flex-1 max-w-xs items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted hover:border-border/80 transition-all duration-200 group"
            title="Busca rápida (⌘K)"
          >
            <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />
            <span className="flex-1 text-left hidden md:block">Buscar...</span>
            <kbd className="hidden md:inline text-[10px] bg-background border border-border rounded-md px-1.5 py-0.5 font-mono text-muted-foreground">⌘K</kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-elevated border-border/60 p-1.5">
                <DropdownMenuLabel className="pb-2">
                  <p className="text-sm font-semibold text-foreground">{fullName}</p>
                  <p className="text-xs text-muted-foreground font-normal">{title}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-lg gap-2 cursor-pointer">
                  <User className="h-4 w-4 text-muted-foreground" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-lg gap-2 cursor-pointer">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ──── Sidebar — desktop ──── */}
        {nav && nav.length > 0 && (
          <aside className="hidden md:flex w-60 border-r border-border/60 bg-card/50 min-h-[calc(100vh-3.5rem)] p-3 flex-col gap-0.5 sticky top-14">
            {/* Role label */}
            <div className="px-3 py-2 mb-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
            </div>

            {nav.map((item, idx) => (
              <Link
                key={item.href}
                to={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {/* Active indicator pill */}
                {item.active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`shrink-0 transition-transform duration-200 ${item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.active && <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />}
              </Link>
            ))}

            {/* User card at bottom */}
            <div className="mt-auto pt-3 border-t border-border/50">
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
                onClick={() => navigate("/dashboard/profile")}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{title}</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ──── Main content ──── */}
        <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-8 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Global Command Palette ⌘K */}
      <GlobalCommand role={role} />

      {/* ──── Mobile bottom nav ──── */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur-xl border-t border-border/60 flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
        >
          {bottomNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-[10px] font-medium transition-all duration-200 ${
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Active top indicator */}
              {item.active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`transition-transform duration-200 ${item.active ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className="truncate max-w-[52px] text-center leading-tight">{item.label}</span>
            </Link>
          ))}

          {/* "Mais" button */}
          {moreNav.length > 0 && (
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-[10px] font-medium transition-colors ${
                    moreNav.some(i => i.active) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="leading-tight">Mais</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl border-border/60 pb-safe">
                <div className="pt-1 pb-6">
                  {/* Handle bar */}
                  <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-1">
                    {title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {moreNav.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
                          item.active
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          item.active ? "bg-primary/20 text-primary" : "bg-muted/80 text-muted-foreground"
                        }`}>
                          {item.icon}
                        </span>
                        <span className="text-center leading-tight">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;

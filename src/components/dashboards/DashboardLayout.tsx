import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, User, Settings, Phone, MoreHorizontal, Menu } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  nav?: { label: string; href: string; icon: ReactNode; active?: boolean }[];
}

const DashboardLayout = ({ children, title, nav }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Split nav: first 4 for bottom bar, rest in "More" sheet
  const bottomNav = nav?.slice(0, 4) ?? [];
  const moreNav = nav && nav.length > 4 ? nav.slice(4) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AloClinica</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.first_name} {profile?.last_name}
            </span>
            <ThemeToggle />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar nav — desktop */}
        {nav && nav.length > 0 && (
          <aside className="hidden md:flex w-60 border-r border-border bg-card min-h-[calc(100vh-4rem)] p-4 flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              {title}
            </p>
            {nav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      {nav && nav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around py-1 px-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}
        >
          {bottomNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors min-w-0 flex-1 ${
                item.active ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              <span className={`${item.active ? "text-primary" : ""}`}>{item.icon}</span>
              <span className="truncate max-w-[52px] text-center leading-tight">{item.label}</span>
            </Link>
          ))}

          {/* "Mais" button if there are extra nav items */}
          {moreNav.length > 0 && (
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors min-w-0 flex-1 ${
                    moreNav.some(i => i.active) ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="leading-tight">Mais</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
                <div className="pt-4 pb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                    {title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {moreNav.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs transition-colors ${
                          item.active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
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

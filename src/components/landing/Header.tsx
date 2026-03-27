import { useState, memo, forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LogIn, LayoutDashboard, ShoppingBag, Video, FileText, Building2, CreditCard, Stethoscope, Brain } from "lucide-react";
import mascot from "@/assets/mascot.png";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const ListItem = forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType; badge?: string }>(({ 
  className, title, children, href, icon: Icon, badge, ...props
}, ref) => (
  <li ref={ref}>
    <NavigationMenuLink asChild>
      <Link
        to={href || "#"}
        className={cn(
          "flex items-center gap-3 select-none rounded-lg p-3 no-underline outline-none transition-all duration-150",
          "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30 group relative",
          "active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {Icon ? (
          <div className="w-9 h-9 rounded-lg bg-primary/[0.06] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.12] transition-colors duration-150">
            <Icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-150" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold leading-none text-foreground">{title}</span>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/8 text-primary/70">{badge}</span>
            )}
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground mt-1">{children}</p>
        </div>
        <div className="w-4 opacity-0 group-hover:opacity-50 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 text-foreground">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

const Header = memo(forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mobileLinks = [
    { label: "Teleconsulta", href: "/teleconsulta" },
    { label: "Sou Médico", href: "/medico" },
    { label: "Sou Laudista", href: "/laudista" },
    { label: "Sou Clínica", href: "/clinica" },
    { label: "Para Empresas", href: "/para-empresas" },
  ];

  return (
    <header
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm shadow-foreground/[0.02] border-border/50"
          : "bg-background/80 backdrop-blur-sm border-transparent"
      )}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between h-14 lg:h-[60px] px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img src={mascot} alt="Pingo" className="w-8 h-8 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105" width={32} height={32} />
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            Alo<span className="text-primary">Clinica</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-0.5">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-medium text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-muted/50 px-3.5 h-9 rounded-lg transition-colors duration-150 gap-1.5">
                  <Video className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Serviços
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[340px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/teleconsulta" title="Teleconsulta" icon={Video} badge="24h">
                        Consultas por vídeo com especialistas, receita digital e acesso rápido.
                      </ListItem>
                      <ListItem href="/consulta-avulsa" title="Consulta Avulsa" icon={Stethoscope}>
                        Atendimento rápido, seguro e sem burocracia.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-medium text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-muted/50 px-3.5 h-9 rounded-lg transition-colors duration-150 gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Profissionais
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[300px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/medico" title="Sou Médico" icon={Stethoscope}>
                        Atenda pacientes online e aumente sua renda.
                      </ListItem>
                      <ListItem href="/laudista" title="Sou Laudista" icon={FileText} badge="IA">
                        Emita laudos à distância com IA e assinatura digital.
                      </ListItem>
                      <ListItem href="/clinica" title="Sou Clínica" icon={Building2}>
                        Gerencie agendamento, prontuário e equipe.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-medium text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-muted/50 px-3.5 h-9 rounded-lg transition-colors duration-150 gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Para Empresas
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[300px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/para-empresas/telelaudo" title="Telelaudo para Clínicas" icon={Brain}>
                        Laudos a distância com IA, SLA e assinatura digital.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-2 text-[13px] font-medium h-9 pl-2.5 pr-4 border-border/60 bg-card/80 shadow-sm hover:shadow hover:border-primary/20 transition-all duration-150 group"
                onClick={() => navigate("/dashboard")}
              >
                <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {profile?.first_name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="text-foreground">
                  {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors duration-150"
                onClick={async () => { await signOut(); navigate("/"); }}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg gap-1.5 text-xs font-semibold h-9 px-4 border-border/60 hover:border-primary/20"
                onClick={() => navigate("/paciente")}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Consulta Avulsa
              </Button>
              <Button
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-semibold h-9 px-4 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={() => navigate("/paciente")}
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrar
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-label="Menu de navegação"
          className="lg:hidden bg-background/98 backdrop-blur-sm border-t border-border/40 overflow-hidden"
        >
          <nav className="flex flex-col px-4 py-3 gap-0.5">
            {mobileLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => { setMobileOpen(false); navigate(link.href); }}
                className="text-sm font-medium py-3 px-3 rounded-lg transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/40 active:bg-muted active:scale-[0.98]"
              >
                {link.label}
              </button>
            ))}

            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/40">
              <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="rounded-lg justify-start gap-2" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>
                    <LayoutDashboard className="w-4 h-4" />
                    {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg justify-start gap-2" onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}>
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="rounded-lg justify-start gap-2 font-semibold" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                    <ShoppingBag className="w-4 h-4" /> Consulta Avulsa
                  </Button>
                  </Button>
                  <Button size="sm" className="rounded-lg justify-start gap-2 bg-primary text-primary-foreground font-semibold" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                    <LogIn className="w-4 h-4" /> Entrar
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}));

Header.displayName = "Header";
export default Header;

import { useState, memo, forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, ShoppingBag, Video, FileText, Building2, CreditCard, Stethoscope, Brain, Eye } from "lucide-react";
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
  className,
  title,
  children,
  href,
  icon: Icon,
  badge,
  ...props
}, ref) => (
  <li ref={ref}>
    <NavigationMenuLink asChild>
      <Link
        to={href || "#"}
        className={cn(
          "flex items-center gap-3.5 select-none rounded-xl p-3.5 no-underline outline-none transition-all duration-200 ease-out",
          "hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/30 group relative",
          "active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {Icon ? (
          <div className="w-10 h-10 rounded-lg bg-primary/[0.07] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.14] transition-all duration-200">
            <Icon className="w-[18px] h-[18px] text-primary/70 group-hover:text-primary transition-colors duration-150" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold leading-none text-foreground group-hover:text-primary transition-colors duration-150">{title}</span>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/10 text-primary/80">{badge}</span>
            )}
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground mt-1">{children}</p>
        </div>
        <div className="w-4 opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 text-foreground">
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
    { label: "Cartão de Benefícios", href: "/cartao-beneficios" },
    { label: "Oftalmologia", href: "/oftalmologia" },
    { label: "Sou Médico", href: "/medico" },
    { label: "Sou Laudista", href: "/laudista" },
    { label: "Sou Clínica", href: "/clinica" },
    { label: "Para Empresas", href: "/para-empresas" },
  ];

  return (
    <header
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-200",
        scrolled
          ? "bg-background shadow-sm shadow-foreground/[0.03] border-border/40"
          : "bg-background/92 border-transparent"
      )}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between h-14 lg:h-[60px] px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <HeartPulse className="w-4.5 h-4.5" />
          </span>
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            Alo<span className="text-primary">Clinica</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Video className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Serviços
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[360px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/teleconsulta" title="Teleconsulta" icon={Video} badge="24h">
                        Consultas por vídeo com especialistas, receita digital e acesso rápido.
                      </ListItem>
                      <ListItem href="/cartao-beneficios" title="Cartão de Benefícios" icon={CreditCard} badge="Popular">
                        Descontos em consultas e exames para toda a família.
                      </ListItem>
                      <ListItem href="/consulta-avulsa" title="Consulta Avulsa" icon={Stethoscope} badge="Rápido">
                        Atendimento rápido, seguro e sem burocracia.
                      </ListItem>
                      <ListItem href="/oftalmologia" title="Oftalmologia" icon={Eye} badge="Novo">
                        Exames, receitas de óculos e laudos oftalmológicos.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Profissionais
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[320px]">
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
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Para Empresas
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[320px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/para-empresas/cartao" title="Cartão Corporativo" icon={CreditCard} badge="B2B">
                        Telemedicina 24h e descontos para colaboradores.
                      </ListItem>
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

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2 text-xs font-semibold h-9 px-4 border-border/60"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={async () => { await signOut(); navigate("/"); }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="rounded-full gap-2 text-xs font-bold h-9 px-5 bg-secondary text-secondary-foreground shadow-sm hover:brightness-110 active:scale-[0.97] transition-all"
                onClick={() => navigate("/consulta-avulsa")}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Comprar Consulta
              </Button>
              <Button
                size="sm"
                className="rounded-full gap-2 text-xs font-bold h-9 px-5 bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.97] transition-all"
                onClick={() => navigate("/paciente")}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Meu Cartão
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          role="dialog"
          aria-label="Menu de navegação"
          className="lg:hidden bg-background/98 border-t border-border/40 overflow-hidden"
        >
          <nav className="flex flex-col px-4 py-4 gap-0.5">
            {mobileLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => { setMobileOpen(false); navigate(link.href); }}
                className="text-sm font-medium py-3 px-4 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted active:scale-[0.98]"
              >
                {link.label}
              </button>
            ))}

            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/40">
              <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl justify-start gap-2" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>
                    <LayoutDashboard className="w-4 h-4" />
                    {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl justify-start gap-2" onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}>
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" className="rounded-xl justify-start gap-2 bg-secondary text-secondary-foreground font-bold" onClick={() => { setMobileOpen(false); navigate("/consulta-avulsa"); }}>
                    <ShoppingBag className="w-4 h-4" /> Comprar Consulta
                  </Button>
                  <Button size="sm" className="rounded-xl justify-start gap-2 bg-primary text-primary-foreground font-bold" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                    <CreditCard className="w-4 h-4" /> Meu Cartão
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

import { useState, memo, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, ShoppingBag, Video, FileText, Building2, CreditCard, Stethoscope, Brain, Globe, Eye } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
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
import logo from "@/assets/logo.png";
import teleconsultaDropdown from "@/assets/teleconsulta-dropdown.png";
import telelaudoPingo from "@/assets/telelaudo-pingo.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotReading from "@/assets/mascot-reading.png";
import mascotWelcome from "@/assets/mascot-welcome.png";
import pingoVirtualAssistant from "@/assets/pingo-virtual-assistant.png";
import devicesMascot from "@/assets/devices-mascot.png";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";

const ListItem = forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType; imgSrc?: string; badge?: string }>(({
  className,
  title,
  children,
  href,
  icon: Icon,
  imgSrc,
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
        {imgSrc ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-border/30 group-hover:ring-primary/40 transition-all duration-200">
            <img src={imgSrc} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : Icon ? (
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
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const mobileLinks = [
    { label: "Teleconsulta", href: "/teleconsulta" },
    { label: "Cartão de Benefícios", href: "/cartao-beneficios" },
    { label: "Sou Médico", href: "/medico" },
    { label: "Sou Laudista", href: "/laudista" },
    { label: "Sou Clínica", href: "/clinica" },
    { label: "Para Empresas", href: "/para-empresas" },
  ];

  return (
    <motion.header
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-300",
        scrolled
          ? "bg-background/95 shadow-sm shadow-foreground/[0.03] border-b border-border/40"
          : "bg-background/70"
      )}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between h-14 lg:h-[60px] px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <motion.img
            src={logo}
            alt="AloClinica"
            className="w-8 h-8 rounded-xl object-contain"
            whileHover={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 0.4 }}
          />
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            Alo<span className="text-primary">Clinica</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden lg:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {/* Serviços */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Video className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Serviços
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[480px]">
                    <ul className="grid gap-1 lg:grid-cols-[.55fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/teleconsulta"
                            className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-b from-primary/[0.06] to-primary/[0.02] p-3.5 no-underline outline-none hover:from-primary/[0.1] hover:to-primary/[0.04] transition-all duration-200 group overflow-hidden active:scale-[0.98]"
                          >
                            <img src={teleconsultaDropdown} alt="Teleconsulta" className="w-full flex-1 object-cover object-center rounded-lg mb-2.5 group-hover:scale-[1.02] transition-transform duration-300" />
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary/60 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              24h Online
                            </span>
                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-150">Teleconsulta</div>
                            <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">
                              Consultas por vídeo com 30+ especialidades.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/cartao-beneficios" title="Cartão de Benefícios" imgSrc={telelaudoPingo} badge="Popular">
                        Descontos em consultas e exames para toda a família.
                      </ListItem>
                      <ListItem href="/consulta-avulsa" title="Consulta Avulsa" imgSrc={mascotWave} badge="Rápido">
                        Atendimento rápido, seguro e sem burocracia.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Profissionais */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Profissionais
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[320px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/medico" title="Sou Médico" imgSrc={mascotThumbsup}>
                        Atenda pacientes online e aumente sua renda.
                      </ListItem>
                      <ListItem href="/laudista" title="Sou Laudista" imgSrc={mascotReading} badge="IA">
                        Emita laudos à distância com IA e assinatura digital.
                      </ListItem>
                      <ListItem href="/clinica" title="Sou Clínica" imgSrc={mascotWelcome}>
                        Gerencie agendamento, prontuário e equipe.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Para Empresas */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group/trigger text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-primary/[0.06] px-4 h-10 rounded-xl transition-all duration-200 gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary/50 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150" />
                  Para Empresas
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2.5 w-[320px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/para-empresas/cartao" title="Cartão Corporativo" imgSrc={pingoVirtualAssistant} badge="B2B">
                        Telemedicina 24h e descontos para colaboradores.
                      </ListItem>
                      <ListItem href="/para-empresas/telelaudo" title="Telelaudo para Clínicas" imgSrc={devicesMascot}>
                        Laudos a distância com IA, SLA e assinatura digital.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* ── Desktop actions ── */}
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

        {/* ── Mobile hamburger ── */}
        <button
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={mobileOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            role="dialog"
            aria-label="Menu de navegação"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden bg-background/98 backdrop-blur-2xl border-t border-border/40 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-0.5">
              {mobileLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035 }}
                  onClick={() => { setMobileOpen(false); navigate(link.href); }}
                  className="text-sm font-medium py-3 px-4 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted active:scale-[0.98]"
                >
                  {link.label}
                </motion.button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}));

Header.displayName = "Header";
export default Header;

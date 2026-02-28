import { useState, memo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, UserRound, ShoppingBag, Video, FileText, Building2, CreditCard, Stethoscope, Brain, Shield, Users, ChevronLeft, ChevronRight } from "lucide-react";
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
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import carouselBenefits from "@/assets/header-carousel-benefits.png";
import carouselBenefits2 from "@/assets/header-carousel-benefits-2.png";
import carouselBenefits3 from "@/assets/header-carousel-benefits-3.png";
import carouselLaudista from "@/assets/header-carousel-laudista.png";
import carouselLaudista2 from "@/assets/header-carousel-laudista-2.png";
import carouselLaudista3 from "@/assets/header-carousel-laudista-3.png";
import carouselMedico from "@/assets/header-carousel-medico.png";
import carouselMedico2 from "@/assets/header-carousel-medico-2.png";
import carouselMedico3 from "@/assets/header-carousel-medico-3.png";
import carouselEmpresas from "@/assets/header-carousel-empresas.png";
import carouselEmpresas2 from "@/assets/header-carousel-empresas-2.png";
import carouselEmpresas3 from "@/assets/header-carousel-empresas-3.png";

const carouselCategories = [
  {
    label: "Cartão de Benefícios",
    href: "/cartao-beneficios",
    icon: CreditCard,
    images: [carouselBenefits, carouselBenefits2, carouselBenefits3],
    descs: [
      "Telemedicina + Clube de Vantagens + Assistência Funerária",
      "Família protegida com acesso à saúde digital",
      "Descontos em farmácias e parceiros de saúde",
    ],
  },
  {
    label: "Telelaudo",
    href: "/telelaudo",
    icon: FileText,
    images: [carouselLaudista, carouselLaudista2, carouselLaudista3],
    descs: [
      "Laudos à distância com IA e assinatura digital",
      "Estação de trabalho com múltiplos monitores DICOM",
      "Relatórios médicos gerados com inteligência artificial",
    ],
  },
  {
    label: "Seja Médico Parceiro",
    href: "/medico",
    icon: Stethoscope,
    images: [carouselMedico, carouselMedico2, carouselMedico3],
    descs: [
      "Atenda pacientes online e aumente sua renda",
      "Teleconsulta do seu consultório ou de casa",
      "Dashboard de ganhos e estatísticas de pacientes",
    ],
  },
  {
    label: "Para Empresas",
    href: "/para-empresas",
    icon: Building2,
    images: [carouselEmpresas, carouselEmpresas2, carouselEmpresas3],
    descs: [
      "Soluções corporativas em telemedicina",
      "Gestão de saúde ocupacional para equipes",
      "Colaboradores acessando saúde digital no trabalho",
    ],
  },
];

const ListItem = ({
  className,
  title,
  children,
  href,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href || "#"}
          className={cn(
            "block select-none rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          {...(props as any)}
        >
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold leading-none text-foreground">{title}</div>
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1">{children}</p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const Header = memo(() => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activeCat, setActiveCat] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Auto-rotate carousel images within active category
  useEffect(() => {
    const timer = setInterval(() => setCarouselIdx(prev => (prev + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, [activeCat]);

  const navLinks = [
    { label: "Teleconsulta", href: "/teleconsulta", isRoute: true },
    { label: "Telelaudo", href: "/telelaudo", isRoute: true },
    { label: "Para Empresas", href: "/para-empresas", isRoute: true },
    { label: "Cartão de Benefícios", href: "/cartao-beneficios", isRoute: true },
  ];

  const handleNavClick = (link: { href: string; isRoute?: boolean }) => {
    if (link.isRoute) {
      navigate(link.href);
      setMobileOpen(false);
      return;
    }
    const id = link.href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Top ticker */}
      <div role="marquee" aria-label="Destaques da plataforma" className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-secondary to-primary overflow-hidden">
        <div aria-hidden="true" className="animate-marquee whitespace-nowrap py-1.5 text-[11px] font-semibold text-primary-foreground tracking-wider uppercase flex">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex shrink-0 items-center">
              <span className="mx-5">✦ {t("marquee.video24h")}</span>
              <span className="mx-5">✦ {t("marquee.validPrescriptions")}</span>
              <span className="mx-5">✦ {t("marquee.topDoctors")}</span>
              <span className="mx-5">✦ {t("marquee.secure")}</span>
              <span className="mx-5">✦ {t("marquee.handy")}</span>
              <span className="mx-5">✦ {t("marquee.family")}</span>
            </span>
          ))}
        </div>
      </div>

      <motion.header
        className="fixed top-[28px] left-0 right-0 z-50 transition-all duration-300"
        animate={{
          backgroundColor: scrolled ? "hsl(var(--background) / 0.97)" : "hsl(var(--background) / 0.8)",
          borderColor: scrolled ? "hsl(var(--border))" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "blur(12px)",
          boxShadow: scrolled ? "0 1px 12px hsl(var(--primary) / 0.06)" : "none",
        }}
        style={{ WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(12px)" }}
      >
        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-hero origin-left"
          style={{ scaleX: scrollYProgress }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border/50" />

        <div className="container mx-auto flex items-center justify-between h-14 lg:h-16 px-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <motion.img
              src={logo}
              alt="AloClinica"
              className="w-8 h-8 rounded-xl object-contain"
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.5 }}
            />
            <span className="text-lg font-extrabold text-foreground tracking-tight">
              Alo<span className="text-gradient">Clinica</span>
            </span>
          </a>

          {/* Desktop nav with NavigationMenu */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Serviços dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold text-foreground/80 hover:text-foreground bg-transparent">
                    Serviços
                  </NavigationMenuTrigger>
                   <NavigationMenuContent>
                    <div className="w-[100vw] max-w-[100vw] p-0 -ml-[50vw] left-1/2 relative">
                      {/* Full-viewport carousel */}
                      <div className="relative w-full h-[70vh] min-h-[400px] max-h-[600px] overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${activeCat}-${carouselIdx}`}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0"
                          >
                            <Link to={carouselCategories[activeCat].href} className="block h-full">
                              <img
                                src={carouselCategories[activeCat].images[carouselIdx]}
                                alt={carouselCategories[activeCat].label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col justify-end p-8 md:p-12 max-w-2xl">
                                <h2 className="text-2xl md:text-4xl font-extrabold text-white uppercase leading-tight tracking-tight">
                                  {carouselCategories[activeCat].label}
                                </h2>
                                <p className="text-sm md:text-base text-white/80 mt-3 leading-relaxed">
                                  {carouselCategories[activeCat].descs[carouselIdx]}
                                </p>
                                <Button
                                  size="sm"
                                  className="mt-4 w-fit rounded-full bg-primary text-primary-foreground font-bold px-6 shadow-lg hover:opacity-90"
                                  onClick={(e) => { e.preventDefault(); navigate(carouselCategories[activeCat].href); }}
                                >
                                  Saiba mais
                                </Button>
                              </div>
                            </Link>
                          </motion.div>
                        </AnimatePresence>
                        {/* Dots centered bottom */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                          {[0, 1, 2].map((i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.preventDefault(); setCarouselIdx(i); }}
                              className={cn(
                                "h-3 rounded-full transition-all",
                                i === carouselIdx ? "bg-primary w-8" : "bg-white/40 hover:bg-white/60 w-3"
                              )}
                            />
                          ))}
                        </div>
                        {/* Arrows */}
                        <button
                          onClick={(e) => { e.preventDefault(); setCarouselIdx(prev => (prev + 2) % 3); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setCarouselIdx(prev => (prev + 1) % 3); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      {/* Category tabs at bottom */}
                      <div className="grid grid-cols-4 bg-background/95 backdrop-blur-lg border-t border-border/50">
                        {carouselCategories.map((cat, i) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.label}
                              onMouseEnter={() => { setActiveCat(i); setCarouselIdx(0); }}
                              onClick={(e) => { e.preventDefault(); navigate(cat.href); }}
                              className={cn(
                                "flex flex-col items-center gap-2 py-4 px-3 text-center transition-all border-b-3",
                                i === activeCat
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                              )}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-xs font-bold leading-tight">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Para Profissionais dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold text-foreground/80 hover:text-foreground bg-transparent">
                    Profissionais
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[340px] gap-1 p-2">
                      <ListItem href="/medico" title="Sou Médico" icon={Stethoscope}>
                        Atenda pacientes online e aumente sua renda.
                      </ListItem>
                      <ListItem href="/laudista" title="Sou Laudista" icon={Brain}>
                        Emita laudos à distância com IA e assinatura digital.
                      </ListItem>
                      <ListItem href="/clinica" title="Sou Clínica" icon={Building2}>
                        Gerencie sua clínica com agendamento e prontuário.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Para Empresas - direct link */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold text-foreground/80 hover:text-foreground bg-transparent cursor-pointer")}>
                    <Link to="/para-empresas">Para Empresas</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-1.5">
            <LanguageSwitcher />
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-semibold border-border/60"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={async () => { await signOut(); navigate("/"); }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-bold bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-md shadow-secondary/20 hover:shadow-lg hover:opacity-90 transition-all px-5"
                  onClick={() => navigate("/consulta-avulsa")}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t("nav.buyConsultation")}
                </Button>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-bold bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-md shadow-success/20 hover:shadow-lg hover:opacity-90 transition-all px-5"
                  onClick={() => navigate("/paciente")}
                >
                  <UserRound className="w-3.5 h-3.5" />
                  {t("nav.imPatient")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
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

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              role="dialog"
              aria-label="Menu de navegação"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden bg-background/98 backdrop-blur-xl border-t border-border/50 overflow-hidden"
            >
              <nav className="flex flex-col px-4 py-4 gap-0.5">
                {navLinks.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleNavClick(link)}
                    className="text-sm font-medium py-3 px-4 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
                  >
                    {link.label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.16 }}
                  onClick={() => { setMobileOpen(false); navigate("/medico"); }}
                  className="text-sm font-medium py-3 px-4 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
                >
                  Sou Médico
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => { setMobileOpen(false); navigate("/laudista"); }}
                  className="text-sm font-medium py-3 px-4 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
                >
                  Sou Laudista
                </motion.button>
                <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/50">
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
                      <Button variant="outline" size="sm" className="rounded-xl justify-start gap-2 border-primary/20 text-primary" onClick={() => { setMobileOpen(false); navigate("/consulta-avulsa"); }}>
                        <ShoppingBag className="w-4 h-4" /> {t("nav.buyConsultation")}
                      </Button>
                      <Button size="sm" className="rounded-xl justify-start gap-2 bg-gradient-hero text-primary-foreground font-bold" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                        <UserRound className="w-4 h-4" /> {t("nav.imPatient")}
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
});
Header.displayName = "Header";
export default Header;

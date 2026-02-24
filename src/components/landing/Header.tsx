import { useState, useEffect, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

// Pre-compute rain drops outside component to avoid re-creation on every render
const RAIN_DROPS = Array.from({ length: 20 }, (_, i) => ({
  key: i,
  left: `${(i / 20) * 100 + Math.random() * 2}%`,
  height: `${8 + Math.random() * 14}px`,
  duration: `${0.5 + Math.random() * 0.7}s`,
  delay: `${Math.random() * 2}s`,
}));

const Header = memo(() => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Track active section
  useEffect(() => {
    const sections = ["como-funciona", "especialidades", "planos", "depoimentos", "faq"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#como-funciona", id: "como-funciona" },
    { label: t("nav.specialties"), href: "#especialidades", id: "especialidades" },
    { label: t("nav.plans"), href: "#planos", id: "planos" },
    { label: t("nav.testimonials"), href: "#depoimentos", id: "depoimentos" },
    { label: t("nav.faq"), href: "#faq", id: "faq" },
  ];

  const smoothScroll = (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Marquee ticker */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-secondary to-primary overflow-hidden shadow-sm">
        <div className="animate-marquee whitespace-nowrap py-2 text-xs font-semibold text-primary-foreground tracking-wide uppercase flex">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex shrink-0 items-center">
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.video24h")}</span>
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.validPrescriptions")}</span>
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.topDoctors")}</span>
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.secure")}</span>
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.handy")}</span>
              <span className="mx-6 flex items-center gap-1.5">{t("marquee.family")}</span>
            </span>
          ))}
        </div>
      </div>

      <motion.header
        className="fixed top-[30px] left-0 right-0 z-50 border-b transition-all duration-300"
        animate={{
          backgroundColor: scrolled ? "hsl(var(--background) / 0.95)" : "hsl(var(--background) / 0.7)",
          borderColor: scrolled ? "hsl(var(--border))" : "hsl(var(--border) / 0.3)",
          backdropFilter: scrolled ? "blur(20px)" : "blur(12px)",
        }}
        style={{ WebkitBackdropFilter: scrolled ? "blur(20px)" : "blur(12px)" }}
      >
        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-hero origin-left"
          style={{ scaleX: useScroll().scrollYProgress }}
        />

        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <motion.img
              src={logo}
              alt="AloClinica"
              className="w-9 h-9 rounded-xl object-contain"
              whileHover={{ rotate: 8, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
            <span className="text-xl font-bold text-foreground">
              Alo<span className="text-gradient">Clinica</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => smoothScroll(link.href)}
                className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeSection === link.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/medico")}>
                  {t("nav.imDoctor")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/consulta-avulsa")}>
                  {t("nav.buyConsultation")}
                </Button>
                <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity" onClick={() => navigate("/paciente")}>
                  {t("nav.imPatient")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-b border-border overflow-hidden"
              id="mobile-menu"
              role="navigation"
              aria-label="Menu mobile"
            >
              <nav className="flex flex-col px-4 py-4 gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => smoothScroll(link.href)}
                    className={`text-sm font-medium py-3 px-3 rounded-lg transition-colors text-left ${
                      activeSection === link.id
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
                  {user ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>
                        <LayoutDashboard className="w-4 h-4 mr-1.5" />
                        {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}>
                        <LogOut className="w-4 h-4 mr-1.5" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/medico"); }}>{t("nav.imDoctor")}</Button>
                      <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/consulta-avulsa"); }}>{t("nav.buyConsultation")}</Button>
                      <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>{t("nav.imPatient")}</Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Rain effect — reduced DOM nodes */}
      <div className="fixed top-[30px] left-0 right-0 z-40 h-24 pointer-events-none overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}>
        {RAIN_DROPS.map((drop) => (
          <div
            key={drop.key}
            className="absolute w-[1px] bg-primary/20 dark:bg-primary/30 rounded-full"
            style={{
              left: drop.left,
              height: drop.height,
              animationName: 'rain-drop',
              animationDuration: drop.duration,
              animationDelay: drop.delay,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            }}
          />
        ))}
      </div>
    </>
  );
});

Header.displayName = "Header";

export default Header;

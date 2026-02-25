import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Stethoscope, UserRound, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

const Header = memo(() => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#como-funciona" },
    { label: t("nav.specialties"), href: "#especialidades" },
    { label: t("nav.plans"), href: "#planos" },
    { label: "Plantão 24h", href: "/paciente", isRoute: true },
    { label: t("nav.faq"), href: "#faq" },
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-secondary to-primary overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 text-[11px] font-semibold text-primary-foreground tracking-wider uppercase flex">
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

        {/* Subtle bottom border */}
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

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center" aria-label="Navegação principal">
            <div className="flex items-center bg-muted/40 rounded-full px-1 py-1 gap-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link)}
                  className="text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-all text-muted-foreground hover:text-foreground hover:bg-background/80"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </nav>

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
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/medico")}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  {t("nav.imDoctor")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => navigate("/consulta-avulsa")}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t("nav.buyConsultation")}
                </Button>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 text-xs font-bold bg-gradient-hero hover:opacity-90 transition-opacity px-5 shadow-sm"
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
                      <Button variant="ghost" size="sm" className="rounded-xl justify-start gap-2 text-muted-foreground" onClick={() => { setMobileOpen(false); navigate("/medico"); }}>
                        <Stethoscope className="w-4 h-4" /> {t("nav.imDoctor")}
                      </Button>
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#como-funciona" },
    { label: t("nav.specialties"), href: "#especialidades" },
    { label: t("nav.plans"), href: "#planos" },
    { label: t("nav.testimonials"), href: "#depoimentos" },
    { label: t("nav.faq"), href: "#faq" },
  ];

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

    <header className="fixed top-[30px] left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="AloClinica" className="w-9 h-9 rounded-xl object-contain" />
          <span className="text-xl font-bold text-foreground">
            Alo<span className="text-gradient">Clinica</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/medico")}>
            {t("nav.imDoctor")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/consulta-avulsa")}>
            {t("nav.buyConsultation")}
          </Button>
          <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity" onClick={() => navigate("/paciente")}>
            {t("nav.imPatient")}
          </Button>
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
            className="md:hidden bg-background border-b border-border"
            id="mobile-menu"
            role="navigation"
            aria-label="Menu mobile"
          >
            <nav className="flex flex-col px-4 py-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/medico"); }}>{t("nav.imDoctor")}</Button>
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/consulta-avulsa"); }}>{t("nav.buyConsultation")}</Button>
                <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>{t("nav.imPatient")}</Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

    {/* Rain effect that fades out at the bottom of the header */}
    <div className="fixed top-[30px] left-0 right-0 z-40 h-24 pointer-events-none overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-[1px] bg-primary/20 dark:bg-primary/30 rounded-full"
          style={{
            left: `${(i / 40) * 100 + Math.random() * 2}%`,
            height: `${8 + Math.random() * 14}px`,
            animationName: 'rain-drop',
            animationDuration: `${0.5 + Math.random() * 0.7}s`,
            animationDelay: `${Math.random() * 2}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}
        />
      ))}
    </div>
    </>
  );
};

export default Header;

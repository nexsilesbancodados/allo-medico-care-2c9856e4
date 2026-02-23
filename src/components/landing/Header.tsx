import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#como-funciona" },
    { label: t("nav.specialties"), href: "#especialidades" },
    { label: t("nav.plans"), href: "#planos" },
    { label: t("nav.testimonials"), href: "#depoimentos" },
    { label: t("nav.faq"), href: "#faq" },
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
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      animate={{
        backgroundColor: scrolled ? "hsl(36 33% 97% / 0.95)" : "hsl(36 33% 97% / 0.8)",
        borderBottom: scrolled ? "1px solid hsl(36 20% 88%)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "blur(8px)",
      }}
      style={{ WebkitBackdropFilter: scrolled ? "blur(20px)" : "blur(8px)" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <img
            src={logo}
            alt="AloClinica"
            className="w-9 h-9 rounded-xl object-contain"
          />
          <span className="text-xl font-bold text-foreground font-display">
            Alo<span className="text-primary">Clinica</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => smoothScroll(link.href)}
              className="text-sm font-medium px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/medico")}>
            {t("nav.imDoctor")}
          </Button>
          <Button size="sm" className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-5" onClick={() => navigate("/paciente")}>
            {t("nav.imPatient")}
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
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
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => smoothScroll(link.href)}
                  className="text-sm font-medium py-3 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/medico"); }}>{t("nav.imDoctor")}</Button>
                <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>{t("nav.imPatient")}</Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

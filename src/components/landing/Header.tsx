import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, UserRound, ShoppingBag } from "lucide-react";
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
    { label: "Teleconsulta", href: "/teleconsulta", isRoute: true },
    { label: "Telelaudo", href: "/telelaudo", isRoute: true },
    { label: "Para Empresas", href: "/para-empresas", isRoute: true },
    { label: "Cartão de Desconto", href: "/cartao-desconto", isRoute: true },
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
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navegação principal">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={() => navigate("/teleconsulta")} className="rounded-full px-5 h-9 text-xs font-bold bg-gradient-to-r from-primary to-[hsl(var(--secondary))] text-primary-foreground shadow-md shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                Teleconsulta
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={() => navigate("/telelaudo")} className="rounded-full px-5 h-9 text-xs font-bold bg-gradient-to-r from-[hsl(190,75%,42%)] to-[hsl(205,85%,50%)] text-white shadow-md shadow-[hsl(200,80%,50%)/0.25] hover:shadow-xl hover:shadow-[hsl(200,80%,50%)/0.35] transition-all duration-300">
                Telelaudo
              </Button>
            </motion.div>
            <Button size="sm" variant="ghost" onClick={() => navigate("/para-empresas")} className="rounded-full px-4 h-9 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
              Para Empresas
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={() => navigate("/cartao-desconto")} className="rounded-full px-4 h-9 text-xs font-bold border-2 border-[hsl(var(--secondary))]/40 bg-[hsl(var(--secondary))]/8 text-[hsl(var(--secondary))] dark:text-[hsl(160,55%,60%)] hover:bg-[hsl(var(--secondary))]/15 hover:border-[hsl(var(--secondary))]/60 transition-all duration-200 gap-1.5">
                <span className="text-sm">💳</span> Cartão Desconto
              </Button>
            </motion.div>
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <div className="w-px h-6 bg-border/50 mx-1" />
            {user ? (
              <>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 h-9 text-xs font-semibold border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                    onClick={() => navigate("/dashboard")}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                  </Button>
                </motion.div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                  onClick={async () => { await signOut(); navigate("/"); }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 h-9 text-xs font-bold bg-gradient-to-r from-[hsl(160,65%,38%)] to-[hsl(175,70%,42%)] text-white shadow-md shadow-[hsl(160,65%,38%)/0.3] hover:shadow-xl hover:shadow-[hsl(160,65%,38%)/0.4] transition-all duration-300 px-5"
                    onClick={() => navigate("/consulta-avulsa")}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t("nav.buyConsultation")}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 h-9 text-xs font-bold bg-gradient-to-r from-[hsl(145,70%,35%)] to-[hsl(158,75%,42%)] text-white shadow-md shadow-[hsl(145,70%,35%)/0.3] hover:shadow-xl hover:shadow-[hsl(145,70%,35%)/0.4] transition-all duration-300 px-5"
                    onClick={() => navigate("/paciente")}
                  >
                    <UserRound className="w-3.5 h-3.5" />
                    {t("nav.imPatient")}
                  </Button>
                </motion.div>
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

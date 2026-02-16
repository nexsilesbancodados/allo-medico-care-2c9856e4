import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Especialidades", href: "#especialidades" },
    { label: "Planos", href: "#planos" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      {/* Marquee ticker */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-secondary to-primary overflow-hidden shadow-sm">
        <div className="animate-marquee whitespace-nowrap py-2 text-xs font-semibold text-primary-foreground tracking-wide uppercase flex">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex shrink-0 items-center">
              <span className="mx-6 flex items-center gap-1.5">✦ Consultas por vídeo 24h</span>
              <span className="mx-6 flex items-center gap-1.5">✦ Receitas digitais válidas</span>
              <span className="mx-6 flex items-center gap-1.5">✦ Médicos com nota máxima</span>
              <span className="mx-6 flex items-center gap-1.5">✦ 100% seguro e criptografado</span>
              <span className="mx-6 flex items-center gap-1.5">✦ Atendimento na palma da mão</span>
              <span className="mx-6 flex items-center gap-1.5">✦ Cuidando de você e sua família</span>
            </span>
          ))}
        </div>
      </div>

    <header className="fixed top-[30px] left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="Alô Médico" className="w-9 h-9 rounded-xl object-contain" />
          <span className="text-xl font-bold text-foreground">
            Alô <span className="text-gradient">Médico</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate("/medico")}>
            Sou Médico
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/consulta-avulsa")}>
            Comprar Consulta
          </Button>
          <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity" onClick={() => navigate("/paciente")}>
            Sou Paciente
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
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
          >
            <nav className="flex flex-col px-4 py-4 gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/medico"); }}>Sou Médico</Button>
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); navigate("/consulta-avulsa"); }}>Comprar Consulta</Button>
                <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>Sou Paciente</Button>
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

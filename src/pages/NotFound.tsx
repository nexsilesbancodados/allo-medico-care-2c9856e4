import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot-reading.png";

const suggestions = [
  { label: "Página inicial", path: "/" },
  { label: "Área do Paciente", path: "/paciente" },
  { label: "Área do Médico", path: "/medico" },
  { label: "Consulta Avulsa", path: "/consulta-avulsa" },
];

const NotFound = () => {
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEOHead title="Página não encontrada" description="A página que você procura não existe." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
      >
        <motion.img
          src={mascotImg}
          alt="Pingo procurando"
          className="w-32 h-32 mx-auto mb-6 object-contain"
          initial={{ rotate: -5 }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          loading="lazy"
        />
        <div className="text-7xl font-black text-primary/15 mb-2 select-none tracking-tighter">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Ops! Página não encontrada</h1>
        <p className="text-muted-foreground mb-2 text-sm">
          A página <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{location.pathname}</code> não existe ou foi movida.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          O Pingo procurou em todo canto, mas não encontrou nada aqui. 🐧
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/"><Home className="w-4 h-4 mr-2" /> Ir para o início</Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-full" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-semibold">Talvez você procure</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map(s => (
              <Link
                key={s.path}
                to={s.path}
                className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Auto redirect */}
        <p className="text-[11px] text-muted-foreground/50 mt-6">
          Redirecionando para a página inicial em {countdown}s...
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;

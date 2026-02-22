import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Instagram, Linkedin, Youtube, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Simulated — no real backend
    setTimeout(() => {
      toast.success("Inscrito com sucesso! 🎉", { description: "Você receberá nossas novidades." });
      setEmail("");
      setSubmitting(false);
    }, 800);
  };

  return (
    <footer aria-label="Rodapé" className="bg-foreground text-background">
      {/* Newsletter strip */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-1">Fique por dentro 💌</h3>
              <p className="text-sm opacity-60">Receba dicas de saúde e novidades da plataforma.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-2 w-full max-w-sm">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40 rounded-xl h-11"
                required
              />
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-5 shrink-0">
                {submitting ? "..." : <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-lg font-bold">AloClinica</span>
            </motion.div>
            <p className="text-sm opacity-60 leading-relaxed mb-4">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança e praticidade.
            </p>
            {/* Social links */}
            <div className="flex gap-2">
              {[
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Plataforma",
              links: [
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Especialidades", href: "#especialidades" },
                { label: "Planos", href: "#planos" },
                { label: "FAQ", href: "#faq" },
              ],
            },
            {
              title: "Acesso",
              links: [
                { label: "Sou Paciente", to: "/paciente" },
                { label: "Sou Médico", to: "/medico" },
                { label: "Consulta Avulsa", to: "/consulta-avulsa" },
                { label: "Administração", to: "/admin" },
              ],
            },
          ].map((col, ci) => (
            <motion.div
              key={ci}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.1 + 0.1 }}
            >
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">{col.title}</h4>
              <ul className="space-y-2.5 text-sm opacity-60" role="list">
                {col.links.map((link, li) => (
                  <li key={li}>
                    {"to" in link ? (
                      <Link to={link.to!} className="hover:opacity-100 transition-opacity duration-200 hover:translate-x-0.5 inline-block">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="hover:opacity-100 transition-opacity duration-200 hover:translate-x-0.5 inline-block">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">Contato</h4>
            <ul className="space-y-3 text-sm opacity-60">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> contato@aloclinica.com.br</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> 0800 123 4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> São Paulo, SP</li>
            </ul>
          </motion.div>
        </div>

        {/* Platform status bar */}
        <div className="mb-6 px-4 py-2.5 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center gap-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="opacity-70">Operação: Normal</span>
          </span>
          <span className="opacity-30 hidden sm:inline">|</span>
          <span className="opacity-70">Plataforma 100% online</span>
          <span className="opacity-30 hidden sm:inline">|</span>
          <span className="opacity-70">Dados protegidos (LGPD)</span>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-40 flex items-center gap-1">
            © 2026 AloClinica. Feito com <Heart className="w-3 h-3 fill-current text-destructive inline" /> no Brasil.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs opacity-40">
            <Link to="/terms" className="hover:opacity-100 transition-opacity duration-200">Termos de Uso</Link>
            <Link to="/privacy" className="hover:opacity-100 transition-opacity duration-200">Privacidade</Link>
            <Link to="/lgpd" className="hover:opacity-100 transition-opacity duration-200">LGPD</Link>
            <Link to="/cookies" className="hover:opacity-100 transition-opacity duration-200">Cookies</Link>
            <Link to="/refund" className="hover:opacity-100 transition-opacity duration-200">Reembolso</Link>
            <Link to="/doctor-terms" className="hover:opacity-100 transition-opacity duration-200">Termos Médicos</Link>
            <Link to="/accessibility" className="hover:opacity-100 transition-opacity duration-200">Acessibilidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

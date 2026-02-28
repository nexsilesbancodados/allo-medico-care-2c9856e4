import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Instagram, Linkedin, Youtube, ArrowRight, Heart, Shield, Award, Lock, Verified, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const trustBadges = [
  { icon: Shield, label: "CFM Regulamentado" },
  { icon: Lock, label: "LGPD Compliant" },
  { icon: Verified, label: "SSL Criptografado" },
  { icon: Award, label: "ISO 27001" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Inscrito com sucesso! 🎉", { description: "Você receberá nossas novidades." });
      setEmail("");
      setSubmitting(false);
    }, 800);
  };

  return (
    <footer aria-label="Rodapé" className="bg-foreground text-background">
      {/* Trust badges strip */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-2 group cursor-default"
              >
                <motion.div
                  className="w-8 h-8 rounded-lg bg-background/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <badge.icon className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                </motion.div>
                <span className="text-xs font-semibold opacity-60 group-hover:opacity-100 transition-opacity">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

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
            <div className="flex gap-2 mb-6">
              {[
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
              ].map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "12.5k+", label: "Pacientes" },
                { value: "500+", label: "Médicos" },
              ].map((stat) => (
                <div key={stat.label} className="bg-background/5 rounded-lg p-2.5 text-center border border-background/10">
                  <p className="text-sm font-bold">{stat.value}</p>
                  <p className="text-[10px] opacity-50">{stat.label}</p>
                </div>
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
                { label: "Cartão de Benefícios", to: "/cartao-beneficios" },
                { label: "Para Empresas", to: "/para-empresas" },
                { label: "FAQ", href: "#faq" },
              ],
            },
            {
              title: "Acesso",
              links: [
                { label: "Sou Paciente", to: "/paciente" },
                { label: "Sou Médico", to: "/medico" },
                { label: "Sou Clínica", to: "/clinica" },
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
                      <a href={link.href} className="hover:opacity-100 transition-opacity duration-200 hover:translate-x-0.5 inline-flex items-center gap-1">
                        {link.label}
                        {"external" in link && link.external && <ExternalLink className="w-3 h-3" />}
                      </a>
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

            {/* App badges */}
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wider">Disponível em</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/10 border border-background/10 text-xs font-medium">
                  🌐 PWA App
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/10 border border-background/10 text-xs font-medium">
                  📱 Mobile
                </div>
              </div>
            </div>
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
          <span className="opacity-30 hidden sm:inline">|</span>
          <span className="opacity-70">Uptime 99.9%</span>
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
